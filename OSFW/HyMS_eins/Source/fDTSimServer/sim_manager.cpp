#include "sim_manager.h"
#include "request_validation.h"
#include "../common/task_group.h"
#include "../common/string_util.h"
#include <deque>
#include <fstream>
#include <map>
#include <sstream>

namespace {
bool same_connection(connectionInfo a, connectionInfo b) {
    return !a.owner_before(b) && !b.owner_before(a);
}

struct managed_engine : std::enable_shared_from_this<managed_engine> {
    std::mutex operation_mutex;
    std::mutex queue_mutex;
    std::deque<std::function<void(sim_engine&)>> queue;
    bool processing = false;
    std::atomic<bool> retired{false};
    std::atomic<bool> auto_run{true};
    sim_engine engine;
    connectionInfo owner;
    std::string project;
    std::string load_error; // Guarded by operation_mutex.
    bool owned = false;
    std::map<std::string, connectionInfo> models;

    explicit managed_engine(const std::string& id) : engine(id) {}
    void cancel() {
        retired = true;
        engine.load_signal->cancel();
    }
    // Each instance preserves request order without blocking either socket's IO thread.
    void post(task_group& tasks, std::function<void(sim_engine&)> work) {
        std::lock_guard<std::mutex> lock(queue_mutex);
        if (retired) return;
        queue.push_back(std::move(work));
        if (processing) return;
        processing = true;
        auto self = shared_from_this();
        try {
            tasks.submit([self]() {
                for (;;) {
                    std::function<void(sim_engine&)> work;
                    {
                        std::lock_guard<std::mutex> lock(self->queue_mutex);
                        if (self->queue.empty()) { self->processing = false; return; }
                        work = std::move(self->queue.front());
                        self->queue.pop_front();
                    }
                    std::lock_guard<std::mutex> lock(self->operation_mutex);
                    if (self->retired) continue;
                    try { work(self->engine); }
                    catch (const std::exception& e) { spdlog::error("# engine request failed: {}", e.what()); }
                    catch (...) { spdlog::error("# engine request failed"); }
                }
            });
        }
        catch (...) { processing = false; queue.clear(); throw; }
    }
};
using engine_ptr = std::shared_ptr<managed_engine>;

void apply_param_override(Json::Value& node, const Json::Value& overrides) {
    if (node.isMember("model_name") && node.isMember("in_param")) {
        for (auto& p : node["in_param"]) {
            const auto key = node["model_name"].asString() + "::" + p["name"].asString();
            if (overrides.isMember(key)) p["value"] = overrides[key];
        }
    }
    if (node.isMember("models"))
        for (auto& child : node["models"]) apply_param_override(child, overrides);
}
}

struct sim_manager_state {
    std::mutex mutex;
    std::unordered_map<std::string, engine_ptr> engines;
    // Connection control-block identity survives close, unlike remote_endpoint().
    std::map<connectionInfo, std::string, std::owner_less<connectionInfo>> sessions;
    bool closing = false;
    unsigned long long next_instance = 0;
    const std::string prefix = "__fdtsim_" + std::to_string(GetCurrentProcessId()) + "_" +
        std::to_string(std::chrono::system_clock::now().time_since_epoch().count()) + "_";
    task_group tasks;

    engine_ptr find(const std::string& id) {
        std::lock_guard<std::mutex> lock(mutex);
        const auto it = engines.find(id);
        return it == engines.end() ? nullptr : it->second;
    }
    std::vector<engine_ptr> owned(connectionInfo owner, const std::string& project) {
        std::vector<engine_ptr> result;
        std::lock_guard<std::mutex> lock(mutex);
        if (closing || sessions.count(owner) == 0) return result;
        for (const auto& item : engines) {
            const auto& entry = item.second;
            if (entry->owned && same_connection(entry->owner, owner) && entry->project == project)
                result.push_back(entry);
        }
        // Preserve per-run addressing for clients using <project>_paramN.
        if (result.empty()) for (const auto& item : engines) {
            const auto& entry = item.second;
            if (entry->owned && same_connection(entry->owner, owner) && entry->engine._run_id >= 0 &&
                entry->project + "_param" + std::to_string(entry->engine._run_id + 1) == project)
                result.push_back(entry);
        }
        std::sort(result.begin(), result.end(), [](const engine_ptr& a, const engine_ptr& b) {
            return a->engine._run_id < b->engine._run_id;
        });
        return result;
    }
    template<class Predicate> std::vector<engine_ptr> unlink(Predicate match) {
        std::vector<engine_ptr> result;
        std::lock_guard<std::mutex> lock(mutex);
        for (auto it = engines.begin(); it != engines.end();) {
            if (match(it->second)) {
                it->second->cancel();
                result.push_back(it->second);
                it = engines.erase(it);
            }
            else ++it;
        }
        return result;
    }
    void dispose(std::vector<engine_ptr> entries) {
        if (entries.empty()) return;
        tasks.submit([entries]() {
            for (const auto& entry : entries) {
                std::lock_guard<std::mutex> lock(entry->operation_mutex);
                entry->engine.stop();
                entry->engine.clear_model();
            }
        });
    }
};

sim_manager::sim_manager() : _state(new sim_manager_state), _masterAgent(nullptr), targetEventId(SIM_ENGINE_EVENT::NONE) {}
sim_manager::~sim_manager() { release(); }

int sim_manager::init(int listen_port) {
    if (model_server_address == "localhost:8864") model_server_address = "localhost:" + std::to_string(listen_port);
    // Bind model responses to the connection that joined this instance and IID.
    // Internal instance names are never reused, so delayed packets from a prior
    // load cannot attach to a replacement or another client's project.
    _model_socket.on_message_callback(PROTOCOL::JOIN::TYPE, [this](connectionInfo conn, const Json::Value& args) {
        const auto project = request_validation::text(args, PROTOCOL::MODEL_INFO::PROJECT_NAME);
        const auto iid = request_validation::text(args, PROTOCOL::JOIN::MODEL_INFO::IID);
        auto entry = _state->find(project);
        if (!entry) { _model_socket.close_client(conn); return; }
        entry->post(_state->tasks, [entry, conn, args, iid](sim_engine& engine) {
            const auto existing = entry->models.find(iid);
            if (existing != entry->models.end() && !same_connection(existing->second, conn))
                throw std::invalid_argument("Model IID already belongs to another connection");
            if (existing == entry->models.end() && entry->owned && !engine.accepts_model(iid))
                throw std::invalid_argument("Unexpected model JOIN");
            engine.add_model(conn, args);
            entry->models[iid] = conn;
        });
    });
    auto response = [this](const std::string& type, std::function<void(sim_engine&, const Json::Value&)> action) {
        _model_socket.on_message_callback(type, [this, action](connectionInfo conn, const Json::Value& args) {
            auto entry = _state->find(request_validation::text(args, PROTOCOL::MODEL_INFO::PROJECT_NAME));
            if (!entry) return;
            const auto iid = request_validation::text(args, PROTOCOL::MODEL_INFO::IID);
            entry->post(_state->tasks, [entry, conn, args, iid, action](sim_engine& engine) {
                const auto model = entry->models.find(iid);
                if (model == entry->models.end() || !same_connection(model->second, conn))
                    throw std::invalid_argument("Model response does not belong to this connection");
                action(engine, args);
            });
        });
    };
    response(PROTOCOL::EXT_TRANS::TYPE, [](sim_engine& e, const Json::Value& a) { e.add_out_msg(a); });
    response(PROTOCOL::TAR::TYPE, [](sim_engine& e, const Json::Value& a) { e.tar(a); });
    response(PROTOCOL::ACK::TYPE, [](sim_engine& e, const Json::Value& a) { e.ack(a); });
    response(PROTOCOL::SIM_CTL::TYPE, [](sim_engine& e, const Json::Value& a) {
        e.ack(a);
        if (a[PROTOCOL::SIM_CTL::MSG].asString() == PROTOCOL::SIM_CTL::SIM_STOP) e.stop();
    });
    _model_socket.on_disconnect_callback = [this](connectionInfo conn) {
        std::vector<engine_ptr> entries;
        {
            std::lock_guard<std::mutex> lock(_state->mutex);
            if (_state->closing) return;
            for (const auto& item : _state->engines) entries.push_back(item.second);
        }
        for (const auto& entry : entries) entry->post(_state->tasks, [entry, conn](sim_engine& engine) {
            for (const auto& model : entry->models) {
                if (same_connection(model.second, conn)) {
                    engine.load_signal->cancel();
                    engine.stop();
                    break;
                }
            }
        });
    };
    _model_socket.on_message_callback(PROTOCOL::POC::TYPE, [this](connectionInfo conn, const Json::Value& args) {
        _model_socket.send_json(conn, "pleasant", args, 1);
    });
    _model_socket.listen(listen_port);
    return 1;
}

int sim_manager::init_gui(int listen_port) {
    _gui_socket.on_connect_callback = [this](connectionInfo conn) {
        const auto id = _gui_socket.get_client_ip_port(conn);
        {
            std::lock_guard<std::mutex> lock(_state->mutex);
            if (_state->closing) return;
            _state->sessions.emplace(conn, id);
        }
        Json::Value res;
        res[PROTOCOL::SIM_CTL::INFO] = id;
        _gui_socket.send_json(conn, PROTOCOL::GUI::RES_M::TYPE.c_str(), res, 1);
    };
    _gui_socket.on_disconnect_callback = [this](connectionInfo conn) {
        {
            std::lock_guard<std::mutex> lock(_state->mutex);
            _state->sessions.erase(conn);
            if (_state->closing) return;
        }
        _state->dispose(_state->unlink([conn](const engine_ptr& e) {
            return e->owned && same_connection(e->owner, conn);
        }));
    };
    _gui_socket.on_message_callback(PROTOCOL::GUI::REQ_M::TYPE, [this](connectionInfo conn, const Json::Value& args) {
        const auto project = request_validation::text(args, PROTOCOL::MODEL_INFO::PROJECT_NAME);
        const auto file = request_validation::text(args, PROTOCOL::MODEL_INFO::FILE_NAME);
        Json::Value document;
        std::ifstream input("./projects/" + project + "/" + file);
        Json::CharReaderBuilder builder;
        JSONCPP_STRING errors;
        if (!parseFromStream(builder, input, &document, &errors)) throw std::invalid_argument("Cannot read model document");
        Json::Value res = args;
        res[PROTOCOL::GUI::REQ_M::CONTENT] = document;
        _gui_socket.send_json(conn, PROTOCOL::GUI::REQ_M::TYPE.c_str(), res, 1);
    });
    _gui_socket.on_message_callback(PROTOCOL::GUI::SIM_CTL::TYPE, [this](connectionInfo conn, const Json::Value& args) {
        try { handle_control(conn, args); }
        catch (const std::exception& e) {
            Json::Value res;
            res["error"] = e.what();
            res["request"] = args;
            _gui_socket.send_json(conn, PROTOCOL::GUI::RES_M::TYPE.c_str(), res, 1);
        }
    });
    _gui_socket.listen(listen_port);
    return 1;
}

void sim_manager::handle_control(connectionInfo conn, const Json::Value& args) {
    const auto project = request_validation::text(args, PROTOCOL::MODEL_INFO::PROJECT_NAME);
    const auto msg = request_validation::text(args, PROTOCOL::GUI::SIM_CTL::MSG);
    if (msg == PROTOCOL::GUI::SIM_CTL::SIM_LOAD) {
        start_load(project, args[PROTOCOL::MODEL_INFO::JSON_DATA], Json::Value(), 0, 0, conn, false, false);
        return;
    }
    if (msg == PROTOCOL::GUI::SIM_CTL::MULTI_LOAD || msg == PROTOCOL::GUI::SIM_CTL::MULTI_RUN) {
        start_load(project, args[PROTOCOL::MODEL_INFO::JSON_DATA], args[PROTOCOL::SIM_CTL::PARAM_SETS],
            request_validation::number(args, PROTOCOL::GUI::SIM_CTL::START_TIME, 0),
            request_validation::number(args, PROTOCOL::GUI::SIM_CTL::END_TIME, 30), conn, true,
            msg == PROTOCOL::GUI::SIM_CTL::MULTI_RUN);
        return;
    }
    auto entries = _state->owned(conn, project);
    if (entries.empty()) throw std::invalid_argument("Project is not loaded by this connection");
    if (msg == PROTOCOL::GUI::SIM_CTL::SIM_UNLOAD) {
        _state->dispose(_state->unlink([entries](const engine_ptr& e) {
            return std::find(entries.begin(), entries.end(), e) != entries.end();
        }));
        return;
    }
    if (msg == PROTOCOL::GUI::SIM_CTL::MULTI_RUN_LOADED) {
        multi_run_loaded(project, args.get(PROTOCOL::SIM_CTL::COUNT, 0).asInt(),
            request_validation::number(args, PROTOCOL::GUI::SIM_CTL::START_TIME, 0),
            request_validation::number(args, PROTOCOL::GUI::SIM_CTL::END_TIME, 30), conn);
        return;
    }
    if (msg != PROTOCOL::GUI::SIM_CTL::SIM_RUN && msg != PROTOCOL::GUI::SIM_CTL::SIM_STOP &&
        msg != PROTOCOL::GUI::SIM_CTL::SIM_PAUSE && msg != PROTOCOL::GUI::SIM_CTL::PARAM)
        throw std::invalid_argument("Unknown simulation command");
    const bool set_time = args.isMember(PROTOCOL::GUI::SIM_CTL::START_TIME);
    const double start = request_validation::number(args, PROTOCOL::GUI::SIM_CTL::START_TIME, 0);
    const double end = request_validation::number(args, PROTOCOL::GUI::SIM_CTL::END_TIME, 0);
    if (set_time) request_validation::times(start, end);
    if (msg == PROTOCOL::GUI::SIM_CTL::PARAM) request_validation::model(args[PROTOCOL::MODEL_INFO::JSON_DATA]);
    for (const auto& entry : entries) {
        if (msg != PROTOCOL::GUI::SIM_CTL::PARAM) entry->auto_run = false;
        entry->post(_state->tasks, [this, conn, args, msg, set_time, start, end](sim_engine& e) {
        try {
            if (msg == PROTOCOL::GUI::SIM_CTL::SIM_RUN) {
                if (!e.load_signal->wait(0)) throw std::invalid_argument("Model load has not completed");
                if (set_time) e.set_sim_time(start, end);
                if (!e.run()) throw std::invalid_argument("Simulation cannot start in its current state");
            }
            else if (msg == PROTOCOL::GUI::SIM_CTL::SIM_STOP) e.stop();
            else if (msg == PROTOCOL::GUI::SIM_CTL::SIM_PAUSE) e.pause();
            else e.update_modelparam(args[PROTOCOL::MODEL_INFO::JSON_DATA]);
        }
        catch (const std::exception& error) {
            Json::Value res;
            res["error"] = error.what();
            res["request"] = args;
            _gui_socket.send_json(conn, PROTOCOL::GUI::RES_M::TYPE.c_str(), res, 1);
        }
        });
    }
}

int sim_manager::start_load(const string& project, const Json::Value& document, const Json::Value& sets,
    double start, double end, connectionInfo owner, bool parallel, bool run) {
    request_validation::model(document);
    request_validation::times(start, end);
    if (parallel) request_validation::parameters(sets);
    const int count = parallel ? static_cast<int>(sets.size()) : 1;
    // Validate all overrides before replacing the previous generation.
    std::vector<Json::Value> documents;
    for (int i = 0; i < count; ++i) {
        Json::Value model = document;
        if (parallel && sets[i].isMember(PROTOCOL::SIM_CTL::OVERRIDES))
            apply_param_override(model, sets[i][PROTOCOL::SIM_CTL::OVERRIDES]);
        documents.push_back(std::move(model));
    }
    std::vector<engine_ptr> entries, previous;
    {
        std::lock_guard<std::mutex> lock(_state->mutex);
        if (_state->closing || _state->sessions.count(owner) == 0)
            throw std::invalid_argument("Client is no longer connected");
        // Reserve all instances before starting background work. A disconnect can
        // therefore cancel the entire request even before its first model loads.
        for (int i = 0; i < count; ++i) {
            auto entry = std::make_shared<managed_engine>(_state->prefix + std::to_string(++_state->next_instance));
            entry->owner = owner;
            entry->owned = true;
            entry->project = project;
            entry->engine.set_gui_handle(owner);
            entry->engine.set_gui_project_name(project);
            entry->engine._run_id = parallel ? sets[i].get(PROTOCOL::SIM_CTL::RUN_ID, i).asInt() : -1;
            entries.push_back(entry);
        }
        for (auto it = _state->engines.begin(); it != _state->engines.end();) {
            auto entry = it->second;
            if (entry->owned && same_connection(entry->owner, owner) && entry->project == project) {
                entry->cancel();
                previous.push_back(entry);
                it = _state->engines.erase(it);
            }
            else ++it;
        }
        for (const auto& entry : entries) _state->engines.emplace(entry->engine.get_project_name(), entry);
    }
    _state->dispose(std::move(previous));
    for (size_t i = 0; i < entries.size(); ++i) {
        auto entry = entries[i];
        Json::Value model = std::move(documents[i]);
        entry->post(_state->tasks, [this, entry, model, start, end, parallel](sim_engine& engine) {
            try {
                if (parallel) {
                    Json::Value res;
                    res["project_name"] = entry->project;
                    res["run_id"] = engine._run_id;
                    res["status"] = PROTOCOL::MULTI_RUN_STATUS::STATUS_LOADING;
                    _gui_socket.send_json(entry->owner, PROTOCOL::MULTI_RUN_STATUS::TYPE.c_str(), res, 1);
                }
                engine.set_sim_time(start, end);
                engine.add_model(model);
                engine.complete_local_load();
            }
            catch (const std::exception& error) {
                entry->load_error = error.what();
                engine.load_signal->cancel();
            }
        });
    }
    _state->tasks.submit([this, entries, owner, parallel, run]() {
        int loaded = 0;
        for (const auto& entry : entries) {
            const bool ok = entry->engine.load_signal->wait(60);
            if (entry->retired) return;
            if (!ok) {
                std::string error;
                { std::lock_guard<std::mutex> lock(entry->operation_mutex); error = entry->load_error; }
                // Roll back this entire load request, never a newer replacement.
                _state->dispose(_state->unlink([entries](const engine_ptr& e) {
                    return std::find(entries.begin(), entries.end(), e) != entries.end();
                }));
                Json::Value res;
                res["project_name"] = entry->project;
                res["load"] = "error";
                res["error"] = error.empty() ? "Model load failed or timed out" : error;
                _gui_socket.send_json(owner, PROTOCOL::GUI::RES_M::TYPE.c_str(), res, 1);
                return;
            }
            ++loaded;
            if (parallel) {
                Json::Value res;
                res["project_name"] = entry->project;
                res["run_id"] = entry->engine._run_id;
                res["status"] = PROTOCOL::MULTI_RUN_STATUS::STATUS_LOADED;
                _gui_socket.send_json(owner, PROTOCOL::MULTI_RUN_STATUS::TYPE.c_str(), res, 1);
            }
        }
        if (run) {
            for (const auto& entry : entries) entry->post(_state->tasks, [this, entry, owner](sim_engine& engine) {
                if (entry->auto_run && engine.run()) {
                    Json::Value res;
                    res["project_name"] = entry->project;
                    res["run_id"] = engine._run_id;
                    res["status"] = PROTOCOL::MULTI_RUN_STATUS::STATUS_RUNNING;
                    _gui_socket.send_json(owner, PROTOCOL::MULTI_RUN_STATUS::TYPE.c_str(), res, 1);
                }
            });
        }
        else if (parallel) {
            Json::Value res;
            res["project_name"] = entries.front()->project;
            res[PROTOCOL::SIM_CTL::MULTI_LOAD_OK] = true;
            res[PROTOCOL::SIM_CTL::COUNT] = loaded;
            _gui_socket.send_json(owner, PROTOCOL::GUI::RES_M::TYPE.c_str(), res, 1);
        }
    });
    return 1;
}

int sim_manager::multi_load(const string& project, const Json::Value& document, const Json::Value& sets,
    double start, double end, connectionInfo owner) {
    return start_load(project, document, sets, start, end, owner, true, false);
}
int sim_manager::multi_run(const string& project, const Json::Value& document, const Json::Value& sets,
    double start, double end, connectionInfo owner) {
    return start_load(project, document, sets, start, end, owner, true, true);
}
int sim_manager::multi_run_loaded(const string& project, int count, double start, double end, connectionInfo owner) {
    request_validation::times(start, end);
    auto entries = _state->owned(owner, project);
    if (count <= 0 || count != static_cast<int>(entries.size()))
        throw std::invalid_argument("count must match this connection's loaded runs");
    for (const auto& entry : entries)
        if (entry->engine._run_id < 0 || !entry->engine.load_signal->wait(0))
            throw std::invalid_argument("Parallel load has not completed");
    for (const auto& entry : entries) entry->post(_state->tasks, [this, owner, start, end, project](sim_engine& engine) {
        engine.set_sim_time(start, end);
        if (engine.run()) {
            Json::Value res;
            res["project_name"] = project;
            res["run_id"] = engine._run_id;
            res["status"] = PROTOCOL::MULTI_RUN_STATUS::STATUS_RUNNING;
            _gui_socket.send_json(owner, PROTOCOL::MULTI_RUN_STATUS::TYPE.c_str(), res, 1);
        }
    });
    return 1;
}

void sim_manager::release() {
    {
        std::lock_guard<std::mutex> lock(_state->mutex);
        if (_state->closing) return;
        _state->closing = true;
        _state->sessions.clear();
    }
    _gui_socket.close();
    auto entries = _state->unlink([](const engine_ptr&) { return true; });
    // Cancel waiters before joining work; sockets remain valid during model release.
    _state->dispose(entries);
    _model_socket.close();
    _state->tasks.close();
}

// Console/local API. Network requests resolve only their own session above.
int sim_manager::sim_add(const string& project) {
    std::lock_guard<std::mutex> lock(_state->mutex);
    if (_state->closing || _state->engines.count(project)) return 0;
    _state->engines.emplace(project, std::make_shared<managed_engine>(project));
    return 1;
}
int sim_manager::sim_del_all() {
    auto entries = _state->unlink([](const engine_ptr&) { return true; });
    _state->dispose(entries);
    return static_cast<int>(entries.size());
}
int sim_manager::sim_del(const string& project) {
    auto entries = _state->unlink([project](const engine_ptr& e) { return e->engine.get_project_name() == project; });
    _state->dispose(entries);
    return static_cast<int>(entries.size());
}
int sim_manager::sim_del_by_gui(const std::shared_ptr<void>& owner) {
    if (!owner) return 0;
    auto entries = _state->unlink([owner](const engine_ptr& e) {
        return same_connection(e->engine.get_gui_handle(), owner);
    });
    _state->dispose(entries);
    return static_cast<int>(entries.size());
}

template<class F> static int with_engine(sim_manager_state& state, const std::string& project, F work) {
    auto entry = state.find(project);
    if (!entry) return 0;
    std::lock_guard<std::mutex> lock(entry->operation_mutex);
    return entry->retired ? 0 : work(entry->engine);
}
int sim_manager::set_default_param(const string& project) { return set_sim_time(project, 0, 1); }
int sim_manager::set_sim_time(const string& project, double start, double end) {
    return with_engine(*_state, project, [=](sim_engine& e) { e.set_sim_time(start, end); return 1; });
}
int sim_manager::sim_run() {
    string project;
    { std::lock_guard<std::mutex> lock(_state->mutex); if (_state->engines.empty()) return 0; project = _state->engines.begin()->first; }
    return sim_run(project);
}
int sim_manager::sim_run(const string& project) { return with_engine(*_state, project, [](sim_engine& e) { return e.run(); }); }
int sim_manager::sim_stop(const string& project) { return with_engine(*_state, project, [](sim_engine& e) { return e.stop(); }); }
int sim_manager::sim_pause(const string& project) { return with_engine(*_state, project, [](sim_engine& e) { return e.pause(); }); }
int sim_manager::set_sim_gui(const string& project, connectionInfo owner) {
    return with_engine(*_state, project, [owner](sim_engine& e) { e.set_gui_handle(owner); return 1; });
}
int sim_manager::load(const string& project, const string& file, const string& uid) {
    return with_engine(*_state, project, [file, uid](sim_engine& e) {
        string path, name;
        if (file.rfind('.') == string::npos) { path = file; name = "index.json"; }
        else { string_util::split_path_name(file, path, name); if (!path.empty()) path.pop_back(); }
        return e.add_model(path, name, "", "", uid);
    });
}
int sim_manager::load(const string& project, const Json::Value& document) {
    return with_engine(*_state, project, [&document](sim_engine& e) { const int result = e.add_model(document); e.complete_local_load(); return result; });
}
std::shared_ptr<model_load_signal> sim_manager::loadSet(const string& project) {
    auto entry = _state->find(project);
    if (!entry) throw std::invalid_argument("Simulation not loaded");
    return entry->engine.load_signal;
}
int sim_manager::unload_all() {
    std::vector<string> projects;
    { std::lock_guard<std::mutex> lock(_state->mutex); for (const auto& e : _state->engines) projects.push_back(e.first); }
    for (const auto& project : projects) unload(project);
    return 1;
}
int sim_manager::unload(const string& project) {
    return with_engine(*_state, project, [](sim_engine& e) { e.stop(); return e.clear_model(); });
}
int sim_manager::unload_model(const string& project, const string& model) {
    return with_engine(*_state, project, [&model](sim_engine& e) { return e.remove_model_req(model); });
}
void sim_manager::print_list_simulation() {
    std::vector<engine_ptr> entries;
    { std::lock_guard<std::mutex> lock(_state->mutex); for (const auto& e : _state->engines) entries.push_back(e.second); }
    for (const auto& entry : entries) {
        std::lock_guard<std::mutex> lock(entry->operation_mutex);
        if (entry->retired) continue;
        std::cout << entry->engine.get_project_name() << " (" << entry->project << ") " << entry->engine.get_engine_state_str() << std::endl;
        entry->engine.print_list_models();
    }
}
int sim_manager::update_model(const string& project, const Json::Value& document) {
    return with_engine(*_state, project, [&document](sim_engine& e) { return e.update_modelparam(document); });
}
bool sim_manager::set_callback(std::string id, std::string project, double end) {
    connectionInfo owner;
    {
        std::lock_guard<std::mutex> lock(_state->mutex);
        if (_state->closing) return false;
        for (const auto& session : _state->sessions) if (session.second == id) { owner = session.first; break; }
    }
    if (owner.expired()) return false;
    Json::Value res;
    res[PROTOCOL::SIM_CTL::PROJECTNAME] = project;
    res[PROTOCOL::SIM_CTL::END_TIME] = end;
    return _gui_socket.send_json(owner, PROTOCOL::GUI::REST_RUN::TYPE.c_str(), res, 1) != 0;
}
