#pragma once
#include <thread>
#include <atomic>
#include <condition_variable>
#include <memory>
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <tuple>
#include <mutex>
#include "model_t.h"
#include "../WebSocket/websocket_server.h"
#include "../WebSocket/websocket_client.h"

using namespace std;

#define ENGINE_STATE_RUN		1
#define ENGINE_STATE_PAUSE		-1
#define ENGINE_STATE_STOP_REQ	-8
#define ENGINE_STATE_STOP		-9


typedef std::function<void(Json::Value& json)> event_proc;
typedef pair<event_proc, Json::Value> event_item;

enum class SIM_ENGINE_EVENT : int {
	NONE = -1,
	MODEL_DEL_COMPLETE,
	MODEL_LOAD_COMPLETE,
};
/// @brief �ùķ��̼� ���� Ŭ����
struct model_load_signal {
    std::mutex mutex;
    std::condition_variable changed;
    bool complete = false;
    bool cancelled = false;
    bool notify() {
        { std::lock_guard<std::mutex> lock(mutex); if (complete || cancelled) return false; complete = true; }
        changed.notify_all();
        return true;
    }
    bool is_cancelled() {
        std::lock_guard<std::mutex> lock(mutex);
        return cancelled;
    }
    void cancel() {
        { std::lock_guard<std::mutex> lock(mutex); cancelled = true; }
        changed.notify_all();
    }
    bool wait(unsigned seconds) {
        std::unique_lock<std::mutex> lock(mutex);
        return changed.wait_for(lock, std::chrono::seconds(seconds), [this] { return complete || cancelled; })
            && complete && !cancelled;
    }
};
class sim_engine
{
public:
	sim_engine(const string& project_name);
	~sim_engine();

	/// @brief �ùķ��̼� ����(������)
	int run();
	
	/// @brief �ùķ��̼� ���� �ð� ����
	/// @param start_time ���۽ð�
	/// @param end_time ����ð�
	void set_sim_time(double start_time = 0.0, double end_time = 0.0);

	/// @brief �ùķ��̼� ����
	int stop();

	/// @brief �ùķ��̼� �Ͻ� ����
	int pause();

	/// @brief ������ �� �߰�
	int add_model(model_t::MODEL_TYPE model_type, const string& iid, const string& uid, const string& model_name);

	/// @brief ������ �� �߰�
	/// @param conn_hdl ������ �ڵ�
	int add_model(connectionInfo conn_hdl, const string& iid, const string& uid, const string& model_name);

	/// @brief ������ �� �߰�
	/// @param conn_hdl ������ �ڵ�
	/// @param args �� ����(json)
	int add_model(connectionInfo conn_hdl, const Json::Value& args);
	bool accepts_model(const std::string& iid) const;
	void complete_local_load();
	/// @brief ������ �� �߰�
	/// @param coupled_model_info �� ����
	int add_model(const Json::Value& coupled_model_info);
	/// @brief ������ �� �߰�(�̻��)
	int add_model(const string& file_path, const string& json_file, const string& model_name, const string& iid, const string& uid);
	/// @brief ��� �� ����
	int clear_model();
	/// @brief �� ���� ��û
	int remove_model_req(const string& model_id, bool immediate = false);
	/// @brief �� ����
	int remove_model(const string& model_id, unsigned depth = 0);
	/// @brief Ŀ�ø� ��Ʈ ����
	int add_couple(const Json::Value& model_info);
	/// @brief ��Ʈ ����
	int add_couple(const string& src_model_id, const string& src_port, const string& dest_model_id, const string& dest_port);
	/// @brief ��Ʈ ���� ���� ����
	void remove_couple(const string& src_model_id, const string& src_port, const string& dest_model_id, const string& dest_port);
	/// @brief external event �߰�
	void add_out_msg(const Json::Value& msg);
	/// @brief ��ϵ� �� ����Ʈ ���
	void print_list_models();
	/// @brief �𵨿��� TA ��û�� ó��
	void tar(const Json::Value& msg);
	/// @brief �𵨿��� OK �����
	void ack(const Json::Value& msg);

	/// @brief �� param ������Ʈ
	int update_modelparam(const Json::Value& coupled_model_info);

	//void update_modelparam(const string& iid, const Json::Value init_param);

	inline int get_engine_state() { return _engine_state; }
	inline const char * get_engine_state_str(){ 
		switch (_engine_state.load()) {
		case ENGINE_STATE_RUN:
			return "ENGINE_STATE_RUN";
		case ENGINE_STATE_PAUSE:
			return "ENGINE_STATE_PAUSE";
		case ENGINE_STATE_STOP_REQ:
			return "ENGINE_STATE_STOP_REQ";
		case ENGINE_STATE_STOP:
			return "ENGINE_STATE_STOP";
		default: return "ENGINE_STATE_UNKNOWN";
		}
	}
	/// @brief GUI ���� ���� ����
	/// @param handle GUI Websocket connection handle
	void set_gui_project_name(const std::string& project) { _gui_project_name = project; }
	void set_gui_handle(connectionInfo handle);
	connectionInfo get_gui_handle();
	const string& get_project_name() {
		return _project_name;
	}

	/// @brief 병렬실행 시 식별자 (-1 = 단일실행)
	int _run_id = -1;

private:
	/// @brief �ùķ��̼� ���۽� ���� ���� loop
	int engine_run();
	void process_events(vector<event_item>& queue);
	void signal_ack();
	DWORD wait_for_ack();

	/// @brief ����->��s ExtTransFn ȣ��, send_ext_trans_msg()�Լ� ȣ��
	void call_ext_trans(const Json::Value& msg);
	/// @brief ����->�� ExtTransFn ȣ�� �� WebSocketó��
	void send_ext_trans_msg(const string& src_model_id, const string& src_model_port, const string& dest_model, Json::Value& msg, unsigned depth = 0);
	/// @brief �� ����
	void model_exec(model_t::MODEL_TYPE model_type, const string& ip_and_port, const string& file_path, const string& file_name,
		const string& model_name, const string& iid, const string& uid, const Json::Value init_param, const string& server_address = "");
	/// @brief �ùķ��̼� �ð�
	double _sim_time;
	/// @brief �ùķ��̼� ����ð�
	double _sim_end_time;
	/// @brief �ε��ؾ��� �� ��
	int _req_load_models;
	/// @brief �ε�� �� ��
	int _loaded_models;
	/// @brief ���� ���� ������ �ڵ�
	thread _thread_instance;
	/// @brief ������ �ε�� �� ����(key=iid)
	unordered_map<string, model_t*> _models;
	/// @brief TA ����(key=iid)
	unordered_map<string, double> _model_ta;
	/// @brief TA ����(key=iid)
	unordered_map<string, double> _continuous_model_ta;
	/// @brief Output�� ���(ExtTransFn�Լ��� �� ����)
	vector<Json::Value> _ext_trans_msg;
	/// @brief �̺�Ʈ sync�� �ڵ�
	HANDLE _event_sync;
	/// @brief ���� ���� Ȯ�ο� �ڵ�
	HANDLE _event_engine_stop;
	/// @brief ������ �����
	mutex _mutex;
	/// @brief Ŭ���̾�Ʈ(�𵨵�)�� ���� üũ��
	std::atomic<int> _ack_count{0};
	/// @brief ���� ����
	std::atomic<int> _engine_state;
	/// @brief ������Ʈ��
	string _project_name;
	string _gui_project_name;
	std::unordered_set<std::string> _joined_model_ids;
	/// @brief GUI Websocket ���� �ڵ�
	connectionInfo _gui_handle;

	// Base URI of the model-designer REST API used to fetch nested coupled models
	// (POST <db_uri>/get_model_info). This used to be hardcoded to a remote host
	// (http://dev.kdtlab.kr:30001), so on any other deployment every nested coupled
	// model silently failed to load and only the top-level models showed up.
	// "http://localhost" goes through the local Nginx, which proxies /get_model_info
	// to the node backend on both the local and the server profile.
	// Matches atomic_manager::db_uri / model_cap's db_uri.
	string db_uri = "http://localhost";

	unordered_map<string, model_t*> _modelsName;


public:
	std::shared_ptr<model_load_signal> load_signal = std::make_shared<model_load_signal>();

	/// @brief ��->���� ��Ŷ �����
	vector<event_item> _recv_packet_buff;
	inline void add_recv_packet(event_proc evt, Json::Value json = Json::Value::nullSingleton(), bool is_insert_front = false) {
		if (_engine_state == ENGINE_STATE_STOP) {
			evt(json);
		}
		else {
			std::lock_guard<std::mutex> lock(_mutex);
			if (is_insert_front)
				_recv_packet_buff.insert(_recv_packet_buff.begin(), make_pair(evt, json));
			else
				_recv_packet_buff.push_back(make_pair(evt, json));

		}
	}
	/// @brief ���� loop���� ó���� �̺�Ʈ
	vector<event_item> _event_table;
	inline void add_event(event_proc evt, Json::Value json = Json::Value::nullSingleton(), bool is_insert_front = false) {
		if (_engine_state == ENGINE_STATE_STOP) {
			evt(json);
		}
		else {
			std::lock_guard<std::mutex> lock(_mutex);
			if (is_insert_front)
				_event_table.insert(_event_table.begin(), make_pair(evt, json));
			else
				_event_table.push_back(make_pair(evt, json));
			

		}
	}
};

