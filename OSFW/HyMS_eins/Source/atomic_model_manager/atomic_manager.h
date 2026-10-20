#pragma once
#include <string>
#include "../WebSocket/websocket_server.h"
#include <unordered_map>
#include <time.h>
#include <io.h>
#include <mutex>
#include <map>
#include <set>
#include <memory>
#include "../common/task_group.h"

// WebSocket Listen Port
#define PORT_NUMBER 8865

using namespace std;
// ������� IP
const std::string ALLOW_IP = "127.0.0.1,192.168.0.1,143.248.187.107,143.248.187.10,143.248.187.22,143.248.187.105,143.248.187.106,";//

typedef struct _CLIENTS_T {
	connectionInfo conn;
	std::string client_id;
} CLIENT_T;
typedef struct _MODEL_FILE_INFO_T {
	string file_path;
	_finddata_t fd;
	struct _MODEL_FILE_INFO_T() {
		file_path = "";
	}
	struct _MODEL_FILE_INFO_T(string path, _finddata_t f) {
		file_path = path;
		fd = f;
	}
} MODEL_FILE_INFO_T;
// ������ Ŭ���̾�Ʈ ����(key=IP)
extern std::unordered_map<string, CLIENT_T> g_model_clients;


class atomic_manager
{
public:
	~atomic_manager() { release(); }
	int init(int listen_port = PORT_NUMBER);

	int init_gui(int listen_port = (PORT_NUMBER + 5));
	void release();
	/// @brief �ùķ��̼� ���� �����Ѵ�(�¶��λ��·� ����)
	/// @param project_name �ùķ��̼� ������Ʈ �̸�
	/// @param model_file_path ������ ���
	/// @param model_file_name �����ϸ�
	/// @param model_name �𵨸�
	/// @param model_id ��id
	/// @param server_ip �ùķ��̼Ǽ��� IP:port
	/// @return 
	int exec_model(const string& project_name, const string& model_file_path, const string& model_file_name, const string& model_name, const string& model_id, const string& server_ip, connectionInfo owner = {});
	/// @brief �������� ���� �����Ѵ�(�������λ��·� ����)
	/// @param project_name �ùķ��̼� ������Ʈ �̸�
	/// @param model_name �𵨸�
	/// @return 
	int kill_model(const string& project_name, const string& model_name, connectionInfo owner = {}, const string& model_id = "");
	/// @brief �������� ��� ���� �����Ѵ�.
	void killall_model();
	/// @brief �������� �� ����Ʈ�� ����Ѵ�.
	/// @param project_name �ùķ��̼� ������Ʈ �̸�
	void list_model(const string& project_name);
	/// @brief �ùķ��̼� ������ ������ ���� ������ ����
	websocket_server _model_socket;
	/// @brief �ùķ��̼� ������ ������ ���� ������ ����
	websocket_server _gui_socket;
	/// @brief ���� �� �κ��丮 ������Ʈ
	/// @return [{file, ok}] for every model file whose mtime changed
	Json::Value update_inventory();
	/// @brief Save a web-uploaded model to ./projects/<project>/<file> and run update_inventory().
	/// @param content_base64 file bytes, base64 encoded
	/// @return {ok, project_name, file_name, size, registered, updated} or {ok:false, error_code, error}
	Json::Value upload_atomic_model(const string& project_name, const string& file_name, const string& content_base64, bool overwrite);
	/// @return [{name, files:[{name, size, mtime}]}] for the project folders under ./projects
	Json::Value list_atomic_files();
	/// @brief Delete ./projects/<project>/<file> and forget it in am_inventory.json.
	/// @return {ok, project_name, file_name, deleted} or {ok:false, error_code, error}; a missing file is ok with deleted=false
	Json::Value delete_atomic_model(const string& project_name, const string& file_name);
	/// @brief Rename ./projects/<project> to ./projects/<new_project> and move its am_inventory.json entries.
	/// @return {ok, project_name, new_project_name, renamed} or {ok:false, error_code, error}; a missing folder is ok with renamed=false
	Json::Value rename_atomic_project(const string& project_name, const string& new_project_name);
	/// @brief Delete the ./projects/<project> folder tree and forget its am_inventory.json entries.
	/// @return {ok, project_name, deleted, files[, leftover]} or {ok:false, error_code, error}; a missing folder is ok with deleted=false
	Json::Value delete_atomic_project(const string& project_name);
	/// @brief db ���� �ּ�(rest api)
	// Was declared but never assigned, so the REST call below built a relative
	// URI and threw. Nginx (port 80) proxies /set_atomic_info to Node.js,
	// same base URL that model_cap.cpp uses.
	string db_uri = "http://localhost";

private:

    struct managed_process {
        DWORD pid = 0;
        HANDLE process = nullptr;
        HANDLE job = nullptr;
        std::string name;
        std::string iid;
        ~managed_process() {
            // The job handle owns the whole process tree, even after its root exits.
            if (job) CloseHandle(job);
            if (process) CloseHandle(process);
        }
        bool active() const {
            JOBOBJECT_BASIC_ACCOUNTING_INFORMATION info = {};
            return job && QueryInformationJobObject(job, JobObjectBasicAccountingInformation,
                &info, sizeof(info), nullptr) && info.ActiveProcesses != 0;
        }
    };
    std::unique_ptr<managed_process> create_process(const string& file_name, const string& arg);
    using model_processes = std::unordered_map<std::string, std::unique_ptr<managed_process>>;
    std::map<connectionInfo, std::unordered_map<std::string, model_processes>, std::owner_less<connectionInfo>> _pid_list;
    std::set<connectionInfo, std::owner_less<connectionInfo>> _owners;
    std::mutex _pid_list_mtx;
    bool _closing = false;
    task_group _background;
    // The console "update" command and web uploads both rewrite am_inventory.json.
    std::mutex _inventory_mtx;
    Json::Value update_inventory_unlocked();
    bool load_inventory(Json::Value& inven);
    void save_inventory(const Json::Value& inven);
    void disconnect_owner(connectionInfo owner);
    Json::Value owned_models(connectionInfo owner, const std::string& project);

	//unordered_map<string, time_t> _local_model_files;
	
	/// @brief �ش� path���� �� ���� ã��
	/// @param path ���
	/// @param out_results ������ ����Ʈ
	void search_files(string path, vector<MODEL_FILE_INFO_T>& out_results);
	//void update_db();

	//int get_atomic_model(const string& atomic_name);

	//void update_db();


	/// @brief ������ ��� ���� ��Ʈ
	int _listen_port;


public:
	std::string get_atomic_model(const string& atomic_path);
	void set_atomic_model(const string& atomic_path, const string& msg);
};


extern atomic_manager _atomic_manager;
#define ATOMIC_MANAGER _atomic_manager
#define MODEL_SOCKET _atomic_manager._model_socket
#define GUI_SOCKET	_atomic_manager._gui_socket
