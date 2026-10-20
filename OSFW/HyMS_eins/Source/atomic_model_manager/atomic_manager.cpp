#include "atomic_manager.h"
#include "../common/common.h"
#include <tlhelp32.h>
#include <iostream>
#include <fstream>
#include "../common/string_util.h"
#include "../common/model_inf.h"
#include "../http_lib/web_client.h"
#include "../external/spdlog/spdlog.h"
#include <array>
#include <cctype>
#include <cstring>

#include <WTypes.h >


namespace {
bool has_owner(connectionInfo owner) {
    connectionInfo empty;
    return owner.owner_before(empty) || empty.owner_before(owner);
}
std::string command_argument(const std::string& value) {
    if (value.find_first_of("\"&|<>^%!\r\n") != std::string::npos || value.find('\0') != std::string::npos)
        throw std::invalid_argument("Unsupported shell character in model argument");
    // Older deployed launchers expand %1 (rather than %~1) into PATH. Quoting
    // simple names such as banksim made that PATH entry contain literal quotes,
    // so LoadLibrary could not find the model DLL. Quote only when needed.
    if (!value.empty() && value.find_first_not_of(
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_./:\\-") == std::string::npos)
        return value;
    std::string result = "\"" + value;
    for (auto it = value.rbegin(); it != value.rend() && *it == '\\'; ++it) result += '\\';
    return result + "\"";
}

// Web uploads arrive as base64 inside one WebSocket message; websocketpp drops
// messages over 32MB, and 20MB of file is ~26.7MB of base64.
const size_t MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

struct upload_error : std::runtime_error {
    std::string code;   // stable id the web UI maps to a message
    upload_error(const std::string& code, const std::string& message) : std::runtime_error(message), code(code) {}
};

// Project folders and model file stems come from the browser, so allow only
// names that cannot leave ./projects, need shell quoting, or hit a device name.
bool is_safe_name(const std::string& name) {
    if (name.empty() || name.size() > 64) return false;
    for (unsigned char c : name)
        if (!isalnum(c) && c != '_' && c != '-') return false;
    std::string upper = name;
    for (auto& c : upper) c = static_cast<char>(toupper(static_cast<unsigned char>(c)));
    if (upper == "CON" || upper == "PRN" || upper == "AUX" || upper == "NUL") return false;
    if (upper.size() == 4 && (upper.compare(0, 3, "COM") == 0 || upper.compare(0, 3, "LPT") == 0) && isdigit(static_cast<unsigned char>(upper[3])))
        return false;
    return true;
}

std::string decode_base64(const std::string& text) {
    static const auto lookup = [] {
        std::array<int, 256> table;
        table.fill(-1);
        const char* alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        for (int i = 0; i < 64; ++i) table[static_cast<unsigned char>(alphabet[i])] = i;
        return table;
    }();
    if (text.size() % 4 != 0) throw upload_error("bad_base64", "Content is not valid base64");
    size_t padding = 0;
    while (padding < 2 && padding < text.size() && text[text.size() - 1 - padding] == '=') ++padding;
    std::string out;
    out.reserve(text.size() / 4 * 3);
    unsigned int buffer = 0;
    int bits = 0;
    for (size_t i = 0; i < text.size() - padding; ++i) {
        const int value = lookup[static_cast<unsigned char>(text[i])];
        if (value < 0) throw upload_error("bad_base64", "Content is not valid base64");
        buffer = (buffer << 6) | value;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out.push_back(static_cast<char>((buffer >> bits) & 0xFF));
        }
    }
    return out;
}

// model_cap_dll.exe is x64, so a 32-bit DLL (or a renamed exe) would only fail
// later inside the registration process, where the web user cannot see why.
bool is_x64_dll(const std::string& data) {
    if (data.size() < 0x40 || data[0] != 'M' || data[1] != 'Z') return false;
    uint32_t pe = 0;
    memcpy(&pe, data.data() + 0x3C, sizeof(pe));
    if (pe > data.size() || data.size() - pe < 24 || memcmp(data.data() + pe, "PE\0\0", 4) != 0) return false;
    uint16_t machine = 0, characteristics = 0;
    memcpy(&machine, data.data() + pe + 4, sizeof(machine));
    memcpy(&characteristics, data.data() + pe + 22, sizeof(characteristics));
    return machine == IMAGE_FILE_MACHINE_AMD64 && (characteristics & IMAGE_FILE_DLL) != 0;
}

const string PROJECTS_DIR = "./projects/";

// am_inventory.json keys are "./projects/<project>/<file>" (see update_inventory_unlocked).
bool is_project_inventory_key(const string& key, const string& project_name) {
    const string prefix = PROJECTS_DIR + project_name + "/";
    return key.size() > prefix.size() && _strnicmp(key.c_str(), prefix.c_str(), prefix.size()) == 0;
}

// Everything under a project folder. Junctions and symlinked folders are listed as links
// to unlink, never followed, so nothing outside the project is touched.
struct project_entries {
    vector<string> files;
    vector<string> dirs;    // a folder comes before its sub folders
    vector<string> links;
};

void collect_entries(const string& dir, project_entries& out) {
    struct _finddata_t fd;
    const intptr_t handle = _findfirst((dir + "/*").c_str(), &fd);
    if (handle == -1L) return;
    do {
        if (strcmp(fd.name, ".") == 0 || strcmp(fd.name, "..") == 0) continue;
        const string path = dir + "/" + fd.name;
        if (!(fd.attrib & _A_SUBDIR)) out.files.push_back(path);
        else if (GetFileAttributesA(path.c_str()) & FILE_ATTRIBUTE_REPARSE_POINT) out.links.push_back(path);
        else {
            out.dirs.push_back(path);
            collect_entries(path, out);
        }
    } while (_findnext(handle, &fd) == 0);
    _findclose(handle);
}

// Opens a file exclusively with write access. Windows refuses that while another process
// has the file open or has it loaded as a DLL image (moving the folder does not detect a
// loaded DLL), so a valid handle means the file is unused and stays so until closed.
HANDLE open_unused(const string& path, bool for_delete) {
    DWORD access = for_delete ? GENERIC_WRITE | DELETE : GENERIC_WRITE;
    const DWORD attributes = GetFileAttributesA(path.c_str());
    if (attributes != INVALID_FILE_ATTRIBUTES && (attributes & FILE_ATTRIBUTE_READONLY)) {
        // A read-only file cannot be opened for writing; sharing mode 0 still detects users.
        if (for_delete) SetFileAttributesA(path.c_str(), attributes & ~FILE_ATTRIBUTE_READONLY);
        else access = GENERIC_READ;
    }
    return CreateFileA(path.c_str(), access, 0, nullptr, OPEN_EXISTING, FILE_FLAG_OPEN_REPARSE_POINT, nullptr);
}

[[noreturn]] void throw_open_error(const string& path, const string& failure_code) {
    const DWORD error = GetLastError();
    if (error == ERROR_SHARING_VIOLATION || error == ERROR_ACCESS_DENIED || error == ERROR_LOCK_VIOLATION)
        throw upload_error("project_in_use", path.substr(PROJECTS_DIR.size()) + " is in use by a running model");
    throw upload_error(failure_code, "Failed to open " + path.substr(PROJECTS_DIR.size()) + " (error " + to_string(error) + ")");
}

// Removes a folder tree and returns how many entries could not be removed.
// Junctions and symlinks are unlinked, never followed, so nothing outside is touched.
int remove_tree(const string& dir, int& removed_files) {
    const DWORD attributes = GetFileAttributesA(dir.c_str());
    if (attributes == INVALID_FILE_ATTRIBUTES) return 0;
    int failed = 0;
    if (!(attributes & FILE_ATTRIBUTE_REPARSE_POINT)) {
        struct _finddata_t fd;
        const intptr_t handle = _findfirst((dir + "/*").c_str(), &fd);
        if (handle != -1L) {
            do {
                if (strcmp(fd.name, ".") == 0 || strcmp(fd.name, "..") == 0) continue;
                const string path = dir + "/" + fd.name;
                if (fd.attrib & _A_SUBDIR) {
                    failed += remove_tree(path, removed_files);
                    continue;
                }
                if (fd.attrib & _A_RDONLY) SetFileAttributesA(path.c_str(), FILE_ATTRIBUTE_NORMAL);
                if (DeleteFileA(path.c_str())) ++removed_files;
                else ++failed;
            } while (_findnext(handle, &fd) == 0);
            _findclose(handle);
        }
    }
    if (!RemoveDirectoryA(dir.c_str())) ++failed;
    return failed;
}

// delete_atomic_project() moves a project aside as ./projects/.deleted_<name>_<tick> before
// removing it. update and listatomicfiles skip dot-prefixed names, so a folder left behind
// by a failed removal is invisible; retry removing such leftovers on the next delete.
void purge_deleted_projects() {
    struct _finddata_t fd;
    const intptr_t handle = _findfirst((PROJECTS_DIR + ".deleted_*").c_str(), &fd);
    if (handle == -1L) return;
    do {
        if (!(fd.attrib & _A_SUBDIR)) continue;
        int removed = 0;
        if (remove_tree(PROJECTS_DIR + fd.name, removed) == 0)
            spdlog::info("# removed leftover project folder: {}", fd.name);
    } while (_findnext(handle, &fd) == 0);
    _findclose(handle);
}

}

int atomic_manager::init(int listen_port)
{
    _listen_port = listen_port;
    _model_socket.on_connect_callback = [this](connectionInfo conn) {
        std::lock_guard<std::mutex> lock(_pid_list_mtx);
        if (!_closing) _owners.insert(conn);
    };
    _model_socket.on_disconnect_callback = [this](connectionInfo conn) { disconnect_owner(conn); };
    _model_socket.on_message_callback(PROTOCOL::ATOMIC::TYPE, [this](connectionInfo conn, const Json::Value& args) {
        Json::Value res;
        bool ok = false;
        try {
            const auto cmd = args.get(PROTOCOL::ATOMIC::CMD, "").asString();
            const auto project = args.get(PROTOCOL::MODEL_INFO::PROJECT_NAME, "").asString();
            const auto name = args.get(PROTOCOL::MODEL_INFO::MODEL_NAME, "").asString();
            const auto iid = args.get(PROTOCOL::MODEL_INFO::IID, "").asString();
            res["cmd"] = cmd;
            res["project_name"] = project;
            res["model_name"] = name;
            res["iid"] = iid;
            if (cmd == PROTOCOL::ATOMIC::EXEC) {
                ok = exec_model(project, args.get(PROTOCOL::MODEL_INFO::FILE_PATH, "").asString(),
                    args.get(PROTOCOL::MODEL_INFO::FILE_NAME, "").asString(), name, iid,
                    args.get(PROTOCOL::MODEL_INFO::SERVER_IP, "localhost:8864").asString(), conn) != 0;
            }
            else if (cmd == PROTOCOL::ATOMIC::KILL) ok = kill_model(project, name, conn, iid) != 0;
            else if (cmd == PROTOCOL::ATOMIC::LIST) ok = true;
            else throw std::invalid_argument("Unknown atomic command");
            res["models"] = owned_models(conn, project);
            if (!ok) res["error"] = "Model operation failed, duplicate instance, or instance not owned by this connection";
        }
        catch (const std::exception& error) { ok = false; res["error"] = error.what(); }
        _model_socket.send_json(conn, ok ? PROTOCOL::ATOMIC::ACK::TYPE.c_str() : PROTOCOL::ATOMIC::NAK::TYPE.c_str(), res, 1);
    });
    // Inventory publication can wait on HTTP; keep the owner socket dispatcher free.
    _model_socket.on_message_callback(PROTOCOL::JOIN::TYPE, [this](connectionInfo conn, const Json::Value& args) {
        _background.submit([this, conn, args]() {
            try {
                http_client_config config;
                config.set_timeout(std::chrono::seconds(10));
                http_client client(string_util::conv_multibyte_to_unicode(db_uri + "/set_atomic_info"), config);
                auto param = json::value::parse(utility::conversions::to_string_t(Json::stringifyJson(args)));
                json::value response;
                web_client::make_request(client, methods::POST, param, response);
            }
            catch (const std::exception& error) { spdlog::error("# inventory publication failed: {}", error.what()); }
            _model_socket.close_client(conn);
        });
    });
    _model_socket.listen(listen_port);
    return 1;
}

int atomic_manager::init_gui(int listen_port)
{
    _gui_socket.on_message_callback(PROTOCOL::GUI::SIM_CTL::GET_ATOMIC_MODEL, [this](connectionInfo conn, const Json::Value& args) {

        string atomic_path = args[PROTOCOL::MODEL_INFO::ATOMIC_NAME].asString();
        atomic_path = "./projects/" + atomic_path;
        // get_atomic_model() throws std::runtime_error when the file can't be opened or
        // read (missing file, bad path, etc). That used to be uncaught here, so it only
        // reached on_message's outer safety net, which logs and swallows it -- the
        // requesting client was simply left waiting forever with no response at all.
        // Report the failure back to the client instead.
        try {
            Json::Value ret_json = args;
            ret_json[PROTOCOL::GUI::REQ_M::CONTENT] = get_atomic_model(atomic_path);
            _gui_socket.send_json(conn, PROTOCOL::GUI::REQ_M::MODEL_TXT.c_str(), ret_json, 1);
        }
        catch (const std::exception& e) {
            spdlog::error("# atomic_manager::GET_ATOMIC_MODEL::{}::{}", atomic_path, e.what());
            Json::Value err_json = args;
            err_json[PROTOCOL::GUI::REQ_M::CONTENT] = "";
            err_json["error"] = e.what();
            _gui_socket.send_json(conn, PROTOCOL::GUI::REQ_M::MODEL_TXT.c_str(), err_json, 1);
        }
        });

    _gui_socket.on_message_callback(PROTOCOL::GUI::SIM_CTL::SET_ATOMIC_MODEL, [this](connectionInfo conn, const Json::Value& args) {

        string atomic_path = args[PROTOCOL::MODEL_INFO::ATOMIC_NAME].asString();
        atomic_path = "./projects/" + atomic_path;
        string msg = args[PROTOCOL::SIM_CTL::MSG].asString();
        try {
            set_atomic_model(atomic_path, msg);

            Json::Value res;
            res[PROTOCOL::SIM_CTL::SIM_LOAD] = "ok";
            _gui_socket.send_json(conn, PROTOCOL::GUI::REQ_M::TYPE.c_str(), res, 1);
        }
        catch (const std::exception& e) {
            spdlog::error("# atomic_manager::SET_ATOMIC_MODEL::{}::{}", atomic_path, e.what());
            Json::Value res;
            res[PROTOCOL::SIM_CTL::SIM_LOAD] = "error";
            res["error"] = e.what();
            _gui_socket.send_json(conn, PROTOCOL::GUI::REQ_M::TYPE.c_str(), res, 1);
        }
        });

    // Web replacement for typing "update" on this console: the browser sends the
    // model file, we store it under ./projects and register it.
    _gui_socket.on_message_callback(PROTOCOL::GUI::SIM_CTL::UPLOAD_ATOMIC_MODEL, [this](connectionInfo conn, const Json::Value& args) {
        // Decoding and saving a large DLL takes a moment; keep the GUI dispatcher free.
        _background.submit([this, conn, args]() {
            Json::Value res = upload_atomic_model(
                args.get(PROTOCOL::MODEL_INFO::PROJECT_NAME, "").asString(),
                args.get(PROTOCOL::MODEL_INFO::FILE_NAME, "").asString(),
                args.get(PROTOCOL::GUI::REQ_M::CONTENT, "").asString(),
                args.get(PROTOCOL::GUI::UPLOAD_M::OVERWRITE, false).asBool());
            res[PROTOCOL::GUI::UPLOAD_M::REQ_ID] = args.get(PROTOCOL::GUI::UPLOAD_M::REQ_ID, "").asString();
            _gui_socket.send_json(conn, PROTOCOL::GUI::UPLOAD_M::RESULT.c_str(), res, 1);
        });
    });

    _gui_socket.on_message_callback(PROTOCOL::GUI::SIM_CTL::LIST_ATOMIC_FILES, [this](connectionInfo conn, const Json::Value& args) {
        Json::Value res;
        res["projects"] = list_atomic_files();
        _gui_socket.send_json(conn, PROTOCOL::GUI::UPLOAD_M::FILES.c_str(), res, 1);
    });

    // The web model manager removes the file here, then the DB row through the Node API.
    _gui_socket.on_message_callback(PROTOCOL::GUI::SIM_CTL::DELETE_ATOMIC_MODEL, [this](connectionInfo conn, const Json::Value& args) {
        Json::Value res = delete_atomic_model(
            args.get(PROTOCOL::MODEL_INFO::PROJECT_NAME, "").asString(),
            args.get(PROTOCOL::MODEL_INFO::FILE_NAME, "").asString());
        res[PROTOCOL::GUI::UPLOAD_M::REQ_ID] = args.get(PROTOCOL::GUI::UPLOAD_M::REQ_ID, "").asString();
        _gui_socket.send_json(conn, PROTOCOL::GUI::UPLOAD_M::DELETED.c_str(), res, 1);
    });

    // Package rename / delete from the web model manager. Like the single-model delete,
    // the folder is handled here first and the DB rows afterwards through the Node API.
    _gui_socket.on_message_callback(PROTOCOL::GUI::SIM_CTL::RENAME_ATOMIC_PROJECT, [this](connectionInfo conn, const Json::Value& args) {
        Json::Value res = rename_atomic_project(
            args.get(PROTOCOL::MODEL_INFO::PROJECT_NAME, "").asString(),
            args.get(PROTOCOL::GUI::UPLOAD_M::NEW_PROJECT_NAME, "").asString());
        res[PROTOCOL::GUI::UPLOAD_M::REQ_ID] = args.get(PROTOCOL::GUI::UPLOAD_M::REQ_ID, "").asString();
        _gui_socket.send_json(conn, PROTOCOL::GUI::UPLOAD_M::PROJECT_RENAMED.c_str(), res, 1);
    });
    _gui_socket.on_message_callback(PROTOCOL::GUI::SIM_CTL::DELETE_ATOMIC_PROJECT, [this](connectionInfo conn, const Json::Value& args) {
        // Removing a large folder tree takes a moment; keep the GUI dispatcher free.
        _background.submit([this, conn, args]() {
            Json::Value res = delete_atomic_project(args.get(PROTOCOL::MODEL_INFO::PROJECT_NAME, "").asString());
            res[PROTOCOL::GUI::UPLOAD_M::REQ_ID] = args.get(PROTOCOL::GUI::UPLOAD_M::REQ_ID, "").asString();
            _gui_socket.send_json(conn, PROTOCOL::GUI::UPLOAD_M::PROJECT_DELETED.c_str(), res, 1);
        });
    });
    spdlog::info("Listen {}", listen_port);
    _gui_socket.listen(listen_port);
    return 1;
}


std::string atomic_manager::get_atomic_model(const string& atomic_path)
{
	std::ifstream file(atomic_path, std::ios_base::binary | std::ios_base::in);
	if (!file.is_open())
		throw std::runtime_error("Failed to open " + atomic_path);
	using Iterator = std::istreambuf_iterator<char>;
	std::string content(Iterator{ file }, Iterator{});
	if (!file)
		throw std::runtime_error("Failed to read " + atomic_path);
    if (file.is_open())
        file.close();
    spdlog::info("{}", content);
	return content;
}

void atomic_manager::set_atomic_model(const string& atomic_path, const string& msg)
{
    std::ofstream file(atomic_path, std::ios_base::binary | std::ios_base::out);
    if (!file.is_open())
        throw std::runtime_error("Failed to open " + atomic_path);
   
    file.write(msg.c_str(), msg.size());
    if (file.is_open())
        file.close();
}

void atomic_manager::release() {
    { std::lock_guard<std::mutex> lock(_pid_list_mtx); _closing = true; }
    _model_socket.close();
    _gui_socket.close();
    killall_model();
    _background.close();
    std::lock_guard<std::mutex> lock(_pid_list_mtx);
    _owners.clear();
}

int atomic_manager::exec_model(const string& project_name, const string& model_file_path,
    const string& model_file_name, const string& model_name, const string& model_id,
    const string& server_ip, connectionInfo owner) {
    if (project_name.empty() || model_name.empty() || model_file_name.empty())
        throw std::invalid_argument("Project, model name and file name are required");
    const auto dot = model_file_name.rfind('.');
    const auto ext = dot == string::npos ? "" : model_file_name.substr(dot + 1);
    const string batch = ext == "dll" ? "dll_model.bat" : ext == "py" ? "python_model.bat" : ext == "m" ? "matlab_model.bat" : "";
    if (batch.empty()) throw std::invalid_argument("Unsupported model extension");
    const auto arg = command_argument(model_file_path) + " " + command_argument(project_name) + " " +
        command_argument(model_file_name) + " " + command_argument(model_name) + " " +
        command_argument(model_id) + " " + command_argument(server_ip);
    std::lock_guard<std::mutex> lock(_pid_list_mtx);
    if (_closing || (has_owner(owner) && _owners.count(owner) == 0)) return 0;
    auto& models = _pid_list[owner][project_name];
    const auto key = model_id.empty() ? "name:" + model_name : "iid:" + model_id;
    const auto found = models.find(key);
    if (found != models.end()) {
        if (found->second->active()) return 0;
        models.erase(found);
    }
    auto process = create_process(batch, arg);
    if (!process) return 0;
    process->name = model_name;
    process->iid = model_id;
    spdlog::info("# model started: {}::{}::{}::PID={}", project_name, model_name, model_id, process->pid);
    models.emplace(key, std::move(process));
    return 1;
}

int atomic_manager::kill_model(const string& project, const string& name, connectionInfo owner, const string& iid) {
    std::lock_guard<std::mutex> lock(_pid_list_mtx);
    const auto client = _pid_list.find(owner);
    if (client == _pid_list.end()) return 0;
    const auto found = client->second.find(project);
    if (found == client->second.end()) return 0;
    int killed = 0;
    for (auto it = found->second.begin(); it != found->second.end();) {
        if (it->second->name == name && (iid.empty() || it->second->iid == iid)) {
            it = found->second.erase(it); // Closing its job terminates only this tree.
            ++killed;
        }
        else ++it;
    }
    if (found->second.empty()) client->second.erase(found);
    if (client->second.empty()) _pid_list.erase(client);
    return killed;
}
void atomic_manager::disconnect_owner(connectionInfo owner) {
    std::lock_guard<std::mutex> lock(_pid_list_mtx);
    _owners.erase(owner);
    _pid_list.erase(owner);
}
void atomic_manager::killall_model() {
    std::lock_guard<std::mutex> lock(_pid_list_mtx);
    _pid_list.clear();
}
Json::Value atomic_manager::owned_models(connectionInfo owner, const std::string& project) {
    std::lock_guard<std::mutex> lock(_pid_list_mtx);
    Json::Value result(Json::arrayValue);
    const auto client = _pid_list.find(owner);
    if (client == _pid_list.end()) return result;
    for (auto prj = client->second.begin(); prj != client->second.end();) {
        for (auto model = prj->second.begin(); model != prj->second.end();) {
            if (!model->second->active()) { model = prj->second.erase(model); continue; }
            if (project.empty() || project == prj->first) {
                Json::Value item;
                item["project_name"] = prj->first;
                item["model_name"] = model->second->name;
                item["iid"] = model->second->iid;
                item["pid"] = Json::UInt(model->second->pid);
                result.append(item);
            }
            ++model;
        }
        if (prj->second.empty()) prj = client->second.erase(prj);
        else ++prj;
    }
    return result;
}
void atomic_manager::list_model(const string& project) {
    std::lock_guard<std::mutex> lock(_pid_list_mtx);
    for (const auto& client : _pid_list)
        for (const auto& prj : client.second)
            if (project.empty() || prj.first == project)
                for (const auto& model : prj.second)
                    spdlog::info("# {}::{}::{}", prj.first, model.second->name, model.second->pid);
}

Json::Value atomic_manager::update_inventory()
{
    std::lock_guard<std::mutex> lock(_inventory_mtx);
    return update_inventory_unlocked();
}

bool atomic_manager::load_inventory(Json::Value& inven)
{
    ifstream ifs;
    ifs.open("./am_inventory.json");
    if (ifs.is_open()) {
        Json::CharReaderBuilder builder;
        builder["collectComments"] = true;
        JSONCPP_STRING errs;
        if (!parseFromStream(builder, ifs, &inven, &errs)) {
            spdlog::debug("errs");
            return false;
        }
        ifs.close();
    }
    return true;
}

void atomic_manager::save_inventory(const Json::Value& inven)
{
    ofstream ofs;
    ofs.open("./am_inventory.json");

    Json::StreamWriterBuilder wbuilder;
    const std::unique_ptr<Json::StreamWriter> writer(wbuilder.newStreamWriter());
    writer->write(inven, &ofs);
    ofs.close();
}

Json::Value atomic_manager::update_inventory_unlocked()
{
    Json::Value inven;
    Json::Value updated_files(Json::arrayValue);
    if (!load_inventory(inven))
        return updated_files;
    vector<MODEL_FILE_INFO_T> local_files;
    search_files("./projects", local_files);
    cout << "****************************************************************************************" << endl;
    int updated = 0;
    string server_ip = "127.0.0.1:";
    server_ip.append(to_string(_listen_port));
    for (const auto& f : local_files) {
        string ext = string_util::get_file_ext(f.fd.name);
        if (ext == "py"
            || ext == "dll"
            || ext == "m") {
            const string key = f.file_path + "/" + f.fd.name;
            __int64 mtime = inven.get(key, 0).asInt64();
            if (f.fd.time_write != mtime) {
                updated++;
                cout << endl << "Update : " << key << ":" << mtime << "->" << f.fd.time_write << endl;
                string path = f.file_path;
                size_t p = path.find("./projects");
                if (p != string::npos) {
                    path = path.substr(p + 11);
                }
                string filename_without_ext;
                string_util::get_file_ext(f.fd.name, &filename_without_ext);
                // The id is the DB key (atomic_models.model_id, unique across projects).
                // Hashing only the file name made the same name in two projects share
                // one DB row; include the project folder so each project keeps its own.
                size_t model_id_hash = hash<string>{}(path + "/" + f.fd.name);
                string model_id = to_string(model_id_hash);
                bool started = false;
                try { started = exec_model(path, path, f.fd.name, filename_without_ext, model_id, "") != 0; }
                catch (const std::exception& e) { spdlog::error("# update::{}::{}", key, e.what()); }
                // Record the new mtime only once registration was launched, so a failed
                // launch is retried by the next update instead of being skipped for good.
                if (started) inven[key] = f.fd.time_write;
                else spdlog::error("# update::registration not started::{}", key);
                Json::Value item;
                item["file"] = key;
                item["ok"] = started;
                updated_files.append(item);
            }
        }
    }
    cout << "****************************************************************************************" << endl;
    cout << updated << " updated files" << endl;
    cout << "****************************************************************************************" << endl;
    save_inventory(inven);
    return updated_files;
}

Json::Value atomic_manager::upload_atomic_model(const string& project_name, const string& file_name,
    const string& content_base64, bool overwrite)
{
    Json::Value res;
    res["ok"] = false;
    res[PROTOCOL::MODEL_INFO::PROJECT_NAME] = project_name;
    res[PROTOCOL::MODEL_INFO::FILE_NAME] = file_name;
    try {
        if (!is_safe_name(project_name))
            throw upload_error("invalid_project_name", "Project name must be 1-64 characters of A-Z, a-z, 0-9, _ or -");
        string stem;
        const string ext = string_util::get_file_ext(file_name, &stem);
        if (file_name.find('.') == string::npos || (ext != "py" && ext != "dll"))
            throw upload_error("unsupported_extension", "Only .py and .dll models can be uploaded");
        if (!is_safe_name(stem))
            throw upload_error("invalid_file_name", "File name must be 1-64 characters of A-Z, a-z, 0-9, _ or - plus .py/.dll");
        // update_inventory() and exec_model() only recognise lower-case extensions.
        const string saved_name = stem + "." + ext;
        res[PROTOCOL::MODEL_INFO::FILE_NAME] = saved_name;

        // The length check only avoids decoding oversized input; base64 rounds up
        // to 3-byte groups, so the exact limit is checked on the decoded size.
        if (content_base64.size() > (MAX_UPLOAD_BYTES + 2) / 3 * 4)
            throw upload_error("too_large", "File exceeds the 20MB upload limit");
        const string data = decode_base64(content_base64);
        if (data.size() > MAX_UPLOAD_BYTES)
            throw upload_error("too_large", "File exceeds the 20MB upload limit");
        if (data.empty()) throw upload_error("empty_file", "File is empty");
        if (ext == "dll" && !is_x64_dll(data))
            throw upload_error("not_x64_dll", "File is not a 64-bit (x64) Windows DLL");
        if (ext == "py" && data.find('\0') != string::npos)
            throw upload_error("not_text", "Python model must be a text file");

        std::lock_guard<std::mutex> lock(_inventory_mtx);
        const string dir = "./projects/" + project_name;
        if (!CreateDirectoryA(dir.c_str(), nullptr)) {
            const DWORD error = GetLastError();
            if (error != ERROR_ALREADY_EXISTS)
                throw upload_error("write_failed", "Failed to create project folder (error " + to_string(error) + ")");
        }
        const string target = dir + "/" + saved_name;
        const DWORD attributes = GetFileAttributesA(target.c_str());
        if (attributes != INVALID_FILE_ATTRIBUTES) {
            if (attributes & FILE_ATTRIBUTE_DIRECTORY)
                throw upload_error("write_failed", "A folder with that name already exists");
            if (!overwrite)
                throw upload_error("file_exists", "File already exists; resend with overwrite to replace it");
        }
        // Write beside the target first so a failed upload never leaves a truncated
        // model behind. search_files() skips dot-prefixed names, so update ignores it.
        const string temp = dir + "/." + saved_name + ".upload";
        {
            std::ofstream file(temp, std::ios_base::binary | std::ios_base::out | std::ios_base::trunc);
            file.write(data.data(), data.size());
            if (!file) {
                file.close();
                DeleteFileA(temp.c_str());
                throw upload_error("write_failed", "Failed to write the uploaded file");
            }
        }
        if (!MoveFileExA(temp.c_str(), target.c_str(), MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)) {
            const DWORD error = GetLastError();
            DeleteFileA(temp.c_str());
            // A DLL that a running model process has loaded cannot be replaced.
            if (error == ERROR_ACCESS_DENIED || error == ERROR_SHARING_VIOLATION)
                throw upload_error("file_in_use", "The existing file is in use by a running model");
            throw upload_error("write_failed", "Failed to save the uploaded file (error " + to_string(error) + ")");
        }
        spdlog::info("# model uploaded: {} ({} bytes, overwrite={})", target, data.size(), overwrite);

        res["size"] = Json::UInt64(data.size());
        res["updated"] = update_inventory_unlocked();
        bool registered = false;
        for (const auto& item : res["updated"])
            if (item["file"].asString() == target && item["ok"].asBool()) registered = true;
        res["registered"] = registered;
        res["ok"] = true;
    }
    catch (const upload_error& e) {
        res["error_code"] = e.code;
        res["error"] = e.what();
    }
    catch (const std::exception& e) {
        res["error_code"] = "write_failed";
        res["error"] = e.what();
    }
    if (!res["ok"].asBool())
        spdlog::warn("# model upload rejected: {}/{}::{}", project_name, file_name, res["error"].asString());
    return res;
}

Json::Value atomic_manager::list_atomic_files()
{
    Json::Value projects(Json::arrayValue);
    struct _finddata_t dir_fd;
    const intptr_t dir_handle = _findfirst("./projects/*", &dir_fd);
    if (dir_handle == -1L) return projects;
    do {
        if (!(dir_fd.attrib & _A_SUBDIR) || !is_safe_name(dir_fd.name)) continue;
        Json::Value project;
        project["name"] = dir_fd.name;
        project["files"] = Json::Value(Json::arrayValue);
        struct _finddata_t fd;
        const string pattern = string("./projects/") + dir_fd.name + "/*";
        const intptr_t handle = _findfirst(pattern.c_str(), &fd);
        if (handle != -1L) {
            do {
                if ((fd.attrib & _A_SUBDIR) || fd.name[0] == '.') continue;
                const string ext = string_util::get_file_ext(fd.name);
                if (ext != "py" && ext != "dll" && ext != "m") continue;
                Json::Value file;
                file["name"] = fd.name;
                file["size"] = Json::UInt64(fd.size);
                file["mtime"] = Json::Int64(fd.time_write);
                project["files"].append(file);
            } while (_findnext(handle, &fd) == 0);
            _findclose(handle);
        }
        projects.append(project);
    } while (_findnext(dir_handle, &dir_fd) == 0);
    _findclose(dir_handle);
    return projects;
}

Json::Value atomic_manager::delete_atomic_model(const string& project_name, const string& file_name)
{
    Json::Value res;
    res["ok"] = false;
    res["deleted"] = false;
    res[PROTOCOL::MODEL_INFO::PROJECT_NAME] = project_name;
    res[PROTOCOL::MODEL_INFO::FILE_NAME] = file_name;
    try {
        if (!is_safe_name(project_name))
            throw upload_error("invalid_project_name", "Invalid project name");
        string stem;
        const string ext = string_util::get_file_ext(file_name, &stem);
        if (file_name.find('.') == string::npos || (ext != "py" && ext != "dll" && ext != "m"))
            throw upload_error("unsupported_extension", "Only .py, .dll and .m models can be deleted");
        if (!is_safe_name(stem))
            throw upload_error("invalid_file_name", "Invalid file name");

        std::lock_guard<std::mutex> lock(_inventory_mtx);
        const string target = "./projects/" + project_name + "/" + file_name;
        const DWORD attributes = GetFileAttributesA(target.c_str());
        // A model registered without a file in this folder only needs its DB row removed.
        if (attributes != INVALID_FILE_ATTRIBUTES) {
            if (attributes & FILE_ATTRIBUTE_DIRECTORY)
                throw upload_error("delete_failed", "Target is a folder");
            if (!DeleteFileA(target.c_str())) {
                const DWORD error = GetLastError();
                if (error == ERROR_ACCESS_DENIED || error == ERROR_SHARING_VIOLATION)
                    throw upload_error("file_in_use", "The file is in use by a running model");
                throw upload_error("delete_failed", "Failed to delete the file (error " + to_string(error) + ")");
            }
            res["deleted"] = true;
            spdlog::info("# model deleted: {}", target);
        }
        // Forget the mtime so a later upload under the same name is registered again.
        Json::Value inven;
        if (load_inventory(inven) && inven.isObject()) {
            bool changed = false;
            for (const auto& key : inven.getMemberNames()) {
                if (_stricmp(key.c_str(), target.c_str()) == 0) {
                    inven.removeMember(key);
                    changed = true;
                }
            }
            if (changed) save_inventory(inven);
        }
        res["ok"] = true;
    }
    catch (const upload_error& e) {
        res["error_code"] = e.code;
        res["error"] = e.what();
    }
    catch (const std::exception& e) {
        res["error_code"] = "delete_failed";
        res["error"] = e.what();
    }
    if (!res["ok"].asBool())
        spdlog::warn("# model delete rejected: {}/{}::{}", project_name, file_name, res["error"].asString());
    return res;
}

Json::Value atomic_manager::rename_atomic_project(const string& project_name, const string& new_project_name)
{
    Json::Value res;
    res["ok"] = false;
    res["renamed"] = false;
    res[PROTOCOL::MODEL_INFO::PROJECT_NAME] = project_name;
    res[PROTOCOL::GUI::UPLOAD_M::NEW_PROJECT_NAME] = new_project_name;
    try {
        if (!is_safe_name(project_name))
            throw upload_error("invalid_project_name", "Invalid project name");
        if (!is_safe_name(new_project_name))
            throw upload_error("invalid_new_project_name", "New project name must be 1-64 characters of A-Z, a-z, 0-9, _ or -");
        if (project_name == new_project_name)
            throw upload_error("same_project_name", "The new project name is the same as the current one");
        // Windows folder names ignore case, so a case-only rename keeps the same folder.
        const bool case_only = _stricmp(project_name.c_str(), new_project_name.c_str()) == 0;

        std::lock_guard<std::mutex> lock(_inventory_mtx);
        const string source = PROJECTS_DIR + project_name;
        const string target = PROJECTS_DIR + new_project_name;
        // Never merge into another project: its models would silently take over these.
        if (!case_only && GetFileAttributesA(target.c_str()) != INVALID_FILE_ATTRIBUTES)
            throw upload_error("project_exists", "A project folder with the new name already exists");
        const DWORD attributes = GetFileAttributesA(source.c_str());
        // A project registered only in the DB has no folder here; only the DB is renamed.
        if (attributes != INVALID_FILE_ATTRIBUTES) {
            if (!(attributes & FILE_ATTRIBUTE_DIRECTORY))
                throw upload_error("rename_failed", "The project path is not a folder");
            // A running model would keep using the old path, so refuse while any file is in use.
            project_entries entries;
            collect_entries(source, entries);
            for (const auto& file : entries.files) {
                const HANDLE handle = open_unused(file, false);
                if (handle == INVALID_HANDLE_VALUE) throw_open_error(file, "rename_failed");
                CloseHandle(handle);
            }
            if (!MoveFileExA(source.c_str(), target.c_str(), 0)) {
                const DWORD error = GetLastError();
                if (error == ERROR_ACCESS_DENIED || error == ERROR_SHARING_VIOLATION)
                    throw upload_error("project_in_use", "A file in the project folder is in use by a running model");
                if (error == ERROR_ALREADY_EXISTS || error == ERROR_FILE_EXISTS)
                    throw upload_error("project_exists", "A project folder with the new name already exists");
                throw upload_error("rename_failed", "Failed to rename the project folder (error " + to_string(error) + ")");
            }
            res["renamed"] = true;
            spdlog::info("# project renamed: {} -> {}", source, target);
        }
        // Keep each file's recorded mtime under the new path, so update does not launch
        // registration for every moved model; their DB rows are renamed by the Node API.
        Json::Value inven;
        if (load_inventory(inven) && inven.isObject()) {
            Json::Value moved(Json::objectValue);
            for (const auto& key : inven.getMemberNames()) {
                if (!is_project_inventory_key(key, project_name)) continue;
                moved[target + key.substr(source.size())] = inven[key];
                inven.removeMember(key);
            }
            if (!moved.empty()) {
                for (const auto& key : moved.getMemberNames()) inven[key] = moved[key];
                save_inventory(inven);
            }
        }
        res["ok"] = true;
    }
    catch (const upload_error& e) {
        res["error_code"] = e.code;
        res["error"] = e.what();
    }
    catch (const std::exception& e) {
        res["error_code"] = "rename_failed";
        res["error"] = e.what();
    }
    if (!res["ok"].asBool())
        spdlog::warn("# project rename rejected: {} -> {}::{}", project_name, new_project_name, res["error"].asString());
    return res;
}

Json::Value atomic_manager::delete_atomic_project(const string& project_name)
{
    Json::Value res;
    res["ok"] = false;
    res["deleted"] = false;
    res["files"] = 0;
    res[PROTOCOL::MODEL_INFO::PROJECT_NAME] = project_name;
    try {
        if (!is_safe_name(project_name))
            throw upload_error("invalid_project_name", "Invalid project name");

        std::lock_guard<std::mutex> lock(_inventory_mtx);
        purge_deleted_projects();
        const string dir = PROJECTS_DIR + project_name;
        const DWORD attributes = GetFileAttributesA(dir.c_str());
        // A project registered only in the DB needs only its DB rows removed.
        if (attributes != INVALID_FILE_ATTRIBUTES) {
            if (!(attributes & FILE_ATTRIBUTE_DIRECTORY))
                throw upload_error("delete_failed", "The project path is not a folder");
            project_entries entries;
            collect_entries(dir, entries);
            // Hold every file exclusively before deleting any, so a project with a file in
            // use by a running model is left whole instead of half deleted.
            vector<HANDLE> handles;
            struct close_handles {
                vector<HANDLE>& list;
                ~close_handles() { for (const HANDLE handle : list) CloseHandle(handle); }
            } closer{ handles };
            for (const auto& file : entries.files) {
                const HANDLE handle = open_unused(file, true);
                if (handle == INVALID_HANDLE_VALUE) throw_open_error(file, "delete_failed");
                handles.push_back(handle);
            }
            // Each file is removed when its handle closes; undo the marks if one is refused.
            FILE_DISPOSITION_INFO dispose = { TRUE };
            size_t marked = 0;
            for (; marked < handles.size(); ++marked)
                if (!SetFileInformationByHandle(handles[marked], FileDispositionInfo, &dispose, sizeof(dispose))) break;
            if (marked < handles.size()) {
                const DWORD error = GetLastError();
                FILE_DISPOSITION_INFO keep = { FALSE };
                for (size_t i = 0; i < marked; ++i)
                    SetFileInformationByHandle(handles[i], FileDispositionInfo, &keep, sizeof(keep));
                throw upload_error("delete_failed", "Failed to delete " + entries.files[marked].substr(PROJECTS_DIR.size()) +
                    " (error " + to_string(error) + ")");
            }
            for (const HANDLE handle : handles) CloseHandle(handle);
            handles.clear();

            int failed = 0;
            for (const auto& link : entries.links)
                if (!RemoveDirectoryA(link.c_str())) ++failed;
            for (auto it = entries.dirs.rbegin(); it != entries.dirs.rend(); ++it)
                if (!RemoveDirectoryA(it->c_str())) ++failed;
            if (!RemoveDirectoryA(dir.c_str())) {
                ++failed;
                // Something re-created a file meanwhile; hide the rest from update and listings.
                const string trash = PROJECTS_DIR + ".deleted_" + project_name + "_" + to_string(GetTickCount64());
                res["leftover"] = MoveFileExA(dir.c_str(), trash.c_str(), 0) ? trash.substr(PROJECTS_DIR.size()) : project_name;
            }
            res["deleted"] = true;
            res["files"] = static_cast<Json::UInt>(entries.files.size());
            if (failed) spdlog::warn("# project deleted, {} folders left: {}", failed, dir);
            else spdlog::info("# project deleted: {} ({} files)", dir, entries.files.size());
        }
        // Forget the mtimes so a later upload into a project of the same name registers again.
        Json::Value inven;
        if (load_inventory(inven) && inven.isObject()) {
            bool changed = false;
            for (const auto& key : inven.getMemberNames()) {
                if (!is_project_inventory_key(key, project_name)) continue;
                inven.removeMember(key);
                changed = true;
            }
            if (changed) save_inventory(inven);
        }
        res["ok"] = true;
    }
    catch (const upload_error& e) {
        res["error_code"] = e.code;
        res["error"] = e.what();
    }
    catch (const std::exception& e) {
        res["error_code"] = "delete_failed";
        res["error"] = e.what();
    }
    if (!res["ok"].asBool())
        spdlog::warn("# project delete rejected: {}::{}", project_name, res["error"].asString());
    return res;
}

std::unique_ptr<atomic_manager::managed_process> atomic_manager::create_process(const string& file, const string& args) {
    const DWORD attributes = GetFileAttributesA(file.c_str());
    if (attributes == INVALID_FILE_ATTRIBUTES || (attributes & FILE_ATTRIBUTE_DIRECTORY)) {
        spdlog::error("# model launcher is missing: {}", file);
        return nullptr;
    }
    std::unique_ptr<managed_process> result(new managed_process);
    result->job = CreateJobObjectA(nullptr, nullptr);
    if (!result->job) return nullptr;
    JOBOBJECT_EXTENDED_LIMIT_INFORMATION limits = {};
    limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
    if (!SetInformationJobObject(result->job, JobObjectExtendedLimitInformation, &limits, sizeof(limits))) return nullptr;
    char directory[MAX_PATH] = {};
    if (!GetSystemDirectoryA(directory, MAX_PATH)) return nullptr;
    const string executable = string(directory) + "\\cmd.exe";
    // Start suspended so no child can escape before the root is assigned to the job.
    string command = "\"" + executable + "\" /D /S /C \"\"" + file + "\" " + args + "\"";
    const UINT codepage = websocket_base::is_utf8(command.c_str()) ? CP_UTF8 : CP_ACP;
    const int length = MultiByteToWideChar(codepage, 0, command.c_str(), -1, nullptr, 0);
    if (!length) return nullptr;
    std::vector<wchar_t> wide_command(length);
    MultiByteToWideChar(codepage, 0, command.c_str(), -1, wide_command.data(), length);
    const std::wstring wide_executable(executable.begin(), executable.end());
    STARTUPINFOW startup = {};
    startup.cb = sizeof(startup);
    PROCESS_INFORMATION process = {};
    if (!CreateProcessW(wide_executable.c_str(), wide_command.data(), nullptr, nullptr, FALSE,
        CREATE_SUSPENDED | CREATE_NO_WINDOW, nullptr, nullptr, &startup, &process)) return nullptr;
    result->process = process.hProcess;
    result->pid = process.dwProcessId;
    if (!AssignProcessToJobObject(result->job, result->process) || ResumeThread(process.hThread) == DWORD(-1)) {
        TerminateProcess(result->process, 1);
        CloseHandle(process.hThread);
        return nullptr;
    }
    CloseHandle(process.hThread);
    return result;
}

void atomic_manager::search_files(string path, vector<MODEL_FILE_INFO_T>& out_results)
{
    struct _finddata_t fd;
    intptr_t handle;
    string path_file = path + "/*.*";
    if ((handle = _findfirst(path_file.c_str(), &fd)) == -1L) //fd 구조체 초기화.
    {
        cout << "No file in directory!" << endl;
        return;
    }
    do
    {
        bool is_dir = fd.attrib & _A_SUBDIR;
        if (is_dir && fd.name[0] != '.') {
            //cout << "Dir  : " << path << "/" << fd.name << endl;
            search_files(path + "/" + fd.name, out_results);//재귀적 호출
        }
        else if (!is_dir && fd.name[0] != '.') {
            //cout << "File : " << path << "/" << fd.name << endl;
            out_results.push_back(MODEL_FILE_INFO_T(path, fd));
        }

    } while (_findnext(handle, &fd) == 0);
    _findclose(handle);
}

