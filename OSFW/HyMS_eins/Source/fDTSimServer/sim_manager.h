#pragma once
#ifndef _SIM_MANAGER_H_
#define _SIM_MANAGER_H_
#include <string>
#include "../WebSocket/websocket_server.h"
#include "../WebSocket/websocket_client.h"
#include "sim_engine.h"

#include <cpprest/http_listener.h>
#include "../common/masterAgent_inf.h"

using namespace web;
using namespace web::http;
using namespace web::http::experimental::listener;

// WebSocket Listen Port
#define PORT_NUMBER 8864

using namespace std;
// ������� IP
const std::string ALLOW_IP = "127.0.0.1,192.168.0.1,143.248.187.107,143.248.187.10,143.248.187.22,143.248.187.106,143.248.187.33";//

typedef struct _CLIENTS_T {
	connectionInfo conn;
	std::string client_id;
} CLIENT_T;

extern std::unordered_map<string, CLIENT_T> g_model_clients;

/// @brief �ùķ��̼� ���� ���� �� Ŭ���̾�Ʈ(��, GUI) ���ӿ� ���� ���� Ŭ����
struct sim_manager_state;

class sim_manager
{
public:
	sim_manager();
	~sim_manager();
	/// @brief �� ���ӿ� ���� �ʱ�ȭ
	/// @param listen_port ��Ʈ��ȣ
	/// @return 
	int init(int listen_port = PORT_NUMBER);
	/// @brief GUI ���ӿ� ���� �ʱ�ȭ
	/// @param listen_port ��Ʈ��ȣ
	/// @return 
	int init_gui(int listen_port = (PORT_NUMBER+5));
	void release();
	/// @brief ������ �ùķ��̼� ������ �߰��Ѵ�
	/// @param project_name �ùķ��̼� ��Ī
	/// @return 
	int sim_add(const string& project_name);
	/// @brief ������ ���� �޸𸮿� �ö�� ��� �ùķ��̼� ������ �����Ѵ�
	/// @return 
	int sim_del_all();
	/// @brief ������ ���� �޸𸮿� �ö�� �ùķ��̼� ������ �����Ѵ�.
	/// @param project_name �ùķ��̼� ��Ī
	/// @return 
	int sim_del(const string& project_name);
	// Retire all engines for this connection, including pending loads.
	int sim_del_by_gui(const std::shared_ptr<void>& gui_target);
	/// @brief �ش� �ùķ��̼� �Է� �Ķ���͸� �ʱ� �Ķ���ͷ� ���� �Ѵ�.
	/// @param project_name �ùķ��̼� ��Ī
	/// @return 
	int set_default_param(const string& project_name);
	/// @brief �ùķ��̼� ����ð� ����
	/// @param project_name �ùķ��̼� ��Ī
	/// @param start_time ���۽ð�
	/// @param end_time ����ð�
	/// @return 
	int set_sim_time(const string& project_name, double start_time, double end_time);
	/// @brief �ùķ��̼� ������� ���� ù��° ���� �����Ѵ�.
	/// @return 
	int sim_run();
	/// @brief �ùķ��̼� ����
	/// @param project_name �ùķ��̼� ��Ī
	/// @return 
	int sim_run(const string& project_name);
	/// @brief �ùķ��̼� ����
	/// @param project_name �ùķ��̼� ��Ī
	/// @return 
	int sim_stop(const string& project_name);
	/// @brief �ùķ��̼� �Ͻ�����
	/// @param project_name �ùķ��̼� ��Ī
	/// @return 
	int sim_pause(const string& project_name);
	/// @brief �ùķ��̼� GUI(������ȭ) �������� ����
	/// @param project_name �ùķ��̼� ��Ī
	/// @param handle ��������
	/// @return 
	int set_sim_gui(const string& project_name, connectionInfo handle);
	/// @brief �ùķ��̼� �ε�
	/// @param project_name �ùķ��̼� ��Ī
	/// @param json_file �ùķ��̼� json ����(root coupled)
	/// @param uid unique id
	/// @return 
	int load(const string& project_name, const string& json_file, const string& uid = "");
	/// @brief �ùķ��̼� �ε�
	/// @param project_name �ùķ��̼� ��Ī
	/// @param json root coupled ����
	/// @return 
	int load(const string& project_name, const Json::Value& json);
	/// @brief ���������� ��� �ùķ��̼� ������ �ε�� ��� ���� ��ε� �Ѵ�.
	/// @return 
	int unload_all();
	/// @brief ���������� �ùķ��̼� ������ �ε�� ��� ���� ��ε� �Ѵ�.
	/// @param project_name �ùķ��̼� ��Ī
	/// @return 
	int unload(const string& project_name);
	/// @brief �ùķ��̼� ������ �ε�� ���� ��ε� �Ѵ�.
	/// @param project_name �ùķ��̼� ��Ī
	/// @param model_name �𵨸�
	/// @return 
	int unload_model(const string& project_name, const string& model_name);
	/// @brief ��ϵ� ��� �𵨵� ����Ʈ
	void print_list_simulation();

	int update_model(const string & project_name, const Json::Value& json);

	/// @brief N개 파라미터 세트를 받아 각각 독립 엔진으로 병렬 실행
	/// @param project_name 기준 프로젝트명
	/// @param json_data 기본 커플드 모델 JSON
	/// @param param_sets 파라미터 세트 배열 [{run_id, overrides:{model::param:value}}]
	/// @param start_t 시뮬레이션 시작 시간
	/// @param end_t 시뮬레이션 종료 시간
	/// @param gui_conn GUI WebSocket 연결 핸들
	int multi_run(const string& project_name, const Json::Value& json_data,
		const Json::Value& param_sets, double start_t, double end_t, connectionInfo gui_conn);
	/// @brief 병렬 로드만 수행 (실행 없음) — multi_run_loaded로 실행
	int multi_load(const string& project_name, const Json::Value& json_data,
		const Json::Value& param_sets, double start_t, double end_t, connectionInfo gui_conn);
	/// @brief 기로드된 병렬 엔진들을 일괄 실행
	int multi_run_loaded(const string& project_name, int count,
		double start_t, double end_t, connectionInfo gui_conn);

	// Override for remote atomic managers; individual models may supply server_ip.
	std::string model_server_address = "localhost:8864";
	websocket_server _model_socket;
	websocket_server _gui_socket;

	masterAgent_inf *_masterAgent;
	std::mutex mtx;
	std::condition_variable sEvent;
	SIM_ENGINE_EVENT targetEventId;

	std::shared_ptr<model_load_signal> loadSet(const string& project_name);
	bool set_callback(std::string id, std::string projectname, double end_t);


private:
	std::unique_ptr<sim_manager_state> _state;
	int start_load(const string& project, const Json::Value& document,
		const Json::Value& sets, double start, double end, connectionInfo owner,
		bool parallel, bool run);
	void handle_control(connectionInfo owner, const Json::Value& args);
};

extern sim_manager _sim_manager;
#define SIM_MANAGER _sim_manager
#define MODEL_SOCKET _sim_manager._model_socket
#define GUI_SOCKET	_sim_manager._gui_socket

#endif