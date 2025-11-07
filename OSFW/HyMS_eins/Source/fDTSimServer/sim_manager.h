#pragma once
#ifndef _SIM_MANAGER_H_
#define _SIM_MANAGER_H_
#include <string>
#include "../WebSocket/websocket_server.h"
#include "../WebSocket/websocket_client.h"


#include "../common/masterAgent_inf.h"

// WebSocket Listen Port
#define PORT_NUMBER 8864

using namespace std;
// 접속허용 IP
const std::string ALLOW_IP = "127.0.0.1,192.168.0.1,143.248.187.107,143.248.187.10,143.248.187.22,143.248.187.106,143.248.187.33";//

typedef struct _CLIENTS_T {
	connectionInfo conn;
	std::string client_id;
} CLIENT_T;

extern std::unordered_map<string, CLIENT_T> g_model_clients;

/// @brief 시뮬레이션 엔진 관리 및 클라이언트(모델, GUI) 접속용 소켓 관리 클래스
class sim_manager
{
public:
	/// @brief 모델 접속용 소켓 초기화
	/// @param listen_port 포트번호
	/// @return 
	int init(int listen_port = PORT_NUMBER);
	/// @brief GUI 접속용 소켓 초기화
	/// @param listen_port 포트번호
	/// @return 
	int init_gui(int listen_port = (PORT_NUMBER+5));
	void release();
	/// @brief 실행할 시뮬레이션 엔진을 추가한다
	/// @param project_name 시뮬레이션 별칭
	/// @return 
	int sim_add(const string& project_name);
	/// @brief 실행을 위해 메모리에 올라온 모든 시뮬레이션 엔진을 삭제한다
	/// @return 
	int sim_del_all();
	/// @brief 실행을 위해 메모리에 올라온 시뮬레이션 엔진을 삭제한다.
	/// @param project_name 시뮬레이션 별칭
	/// @return 
	int sim_del(const string& project_name);
	/// @brief 해당 시뮬레이션 입력 파라미터를 초기 파라미터로 설정 한다.
	/// @param project_name 시뮬레이션 별칭
	/// @return 
	int set_default_param(const string& project_name);
	/// @brief 시뮬레이션 실행시간 설정
	/// @param project_name 시뮬레이션 별칭
	/// @param start_time 시작시간
	/// @param end_time 종료시간
	/// @return 
	int set_sim_time(const string& project_name, double start_time, double end_time);
	/// @brief 시뮬레이션 대기중인 모델중 첫번째 모델을 실행한다.
	/// @return 
	int sim_run();
	/// @brief 시뮬레이션 실행
	/// @param project_name 시뮬레이션 별칭
	/// @return 
	int sim_run(const string& project_name);
	/// @brief 시뮬레이션 종료
	/// @param project_name 시뮬레이션 별칭
	/// @return 
	int sim_stop(const string& project_name);
	/// @brief 시뮬레이션 일시정지
	/// @param project_name 시뮬레이션 별칭
	/// @return 
	int sim_pause(const string& project_name);
	/// @brief 시뮬레이션 GUI(웹가시화) 연결정보 설정
	/// @param project_name 시뮬레이션 별칭
	/// @param handle 연결정보
	/// @return 
	int set_sim_gui(const string& project_name, connectionInfo handle);
	/// @brief 시뮬레이션 로드
	/// @param project_name 시뮬레이션 별칭
	/// @param json_file 시뮬레이션 json 파일(root coupled)
	/// @param uid unique id
	/// @return 
	int load(const string& project_name, const string& json_file, const string& uid);
	/// @brief 시뮬레이션 로드
	/// @param project_name 시뮬레이션 별칭
	/// @param json root coupled 정보
	/// @return 
	int load(const string& project_name, const Json::Value& json);
	/// @brief 실행대기중인 모든 시뮬레이션 엔진에 로드된 모든 모델을 언로드 한다.
	/// @return 
	int unload_all();
	/// @brief 실행대기중인 시뮬레이션 엔진에 로드된 모든 모델을 언로드 한다.
	/// @param project_name 시뮬레이션 별칭
	/// @return 
	int unload(const string& project_name);
	/// @brief 시뮬레이션 엔진에 로드된 모델을 언로드 한다.
	/// @param project_name 시뮬레이션 별칭
	/// @param model_name 모델명
	/// @return 
	int unload_model(const string& project_name, const string& model_name);
	/// @brief 등록된 모든 모델들 리스트
	void print_list_simulation();

	int update_model(const string & project_name, const Json::Value& json);

	websocket_server _model_socket;
	websocket_server _gui_socket;

	masterAgent_inf *_masterAgent;
	std::mutex mtx;
	std::condition_variable sEvent;
	SIM_ENGINE_EVENT targetEventId;

	int loadSet(const string& project_name, std::condition_variable* sEvent, SIM_ENGINE_EVENT* Id);
	int init_masterAgent(masterAgent_inf* masterAgent);
private:
	
};


extern sim_manager _sim_manager;
#define SIM_MANAGER _sim_manager
#define MODEL_SOCKET _sim_manager._model_socket
#define GUI_SOCKET	_sim_manager._gui_socket

class  externalTest2 : public masterAgent_inf
{

public:
	externalTest2()
	{

	}

	int sim_run(const string& projectname, const string& sim_start_time, const string& sim_end_time)
	{
		std::cout << ">>>>>>>>>>>>>>>>>> externalTest2 - sim_run()" << endl;

		return 1;
	}

	int init()
	{
		std::cout << ">>>>>>>>>>>>>>>>>> externalTest2 - init()" << endl;
		return 1;
	}


	int receive()
	{
		Json::Value args;
		Json::Reader reader;

		string aaa = "{\"json_data\":{\"color\":\"hsla(77, 100%, 50%, 1)\",\"file_name\":\"untitled.json\",\"file_path\":null,\"idx\":-1,\"iid\":\"m2h4mo8ayy42z1nve\",\"in_param\":[],\"in_port\":[],\"ip_port\":\"localhost:8865\",\"model_name\":\"untitled\",\"model_type\":99,\"models\":[{\"color\":\"hsla(77, 100%, 50%, 1)\",\"file_name\":\"poc.json\",\"file_path\":null,\"idx\":-1,\"iid\":\"m2h4mrd3uja5umjp8\",\"in_param\":[],\"in_port\":[],\"ip_port\":\"localhost:8865\",\"model_name\":\"poc\",\"model_type\":99,\"models\":[{\"color\":\"hsla(77, 100%, 50%, 1)\",\"file_name\":\"poc.json\",\"file_path\":null,\"idx\":-1,\"iid\":\"m2h4iy9xiq97gt7vk\",\"in_param\":[],\"in_port\":[],\"ip_port\":\"localhost:8865\",\"model_name\":\"poc\",\"model_type\":99,\"models\":[{\"color\":\"hsla(102, 100%, 50%, 1)\",\"file_name\":\"poc_calculation_atomic.dll\",\"file_path\":\"banksim9\",\"idx\":-1,\"iid\":\"m2h4jga3l7rsj72i0\",\"in_param\":[],\"in_port\":[{\"index\":0,\"line\":[],\"name\":\"POC1_IN\"}],\"ip_port\":\"localhost:8865\",\"model_name\":\"poc_calculation_atomic\",\"model_type\":1,\"models\":[],\"out_port\":[{\"index\":0,\"line\":[{\"from_obj_info\":{\"iid\":\"m2h4jga3l7rsj72i0\",\"port_name\":\"POC1_OUT\"},\"to_obj_info\":{\"iid\":\"m2h4ji3eqooijsdxx\",\"port_name\":\"POC2_IN\"},\"user_offset\":[0,0,0,0]},{\"from_obj_info\":{\"iid\":\"m2h4jga3l7rsj72i0\",\"port_name\":\"POC1_OUT\"},\"to_obj_info\":{\"iid\":\"m2h4jl6a88g1f1v1z\",\"port_name\":\"POC3_IN\"},\"user_offset\":[0,0,0,0]},{\"from_obj_info\":{\"iid\":\"m2h4jga3l7rsj72i0\",\"port_name\":\"POC1_OUT\"},\"to_obj_info\":{\"iid\":\"m2h4jjqd3uuptx5vl\",\"port_name\":\"POC4_IN\"},\"user_offset\":[0,0,0,0]}],\"name\":\"POC1_OUT\"}],\"position\":{\"x\":155.20503776009087,\"y\":155.72415704896764},\"uid\":\"m2h4jga35fxpih5dl\"},{\"color\":\"hsla(333, 100%, 50%, 1)\",\"file_name\":\"poc_forecastweather_atomic.dll\",\"file_path\":\"banksim9\",\"idx\":1,\"iid\":\"m2h4ji3eqooijsdxx\",\"in_param\":[],\"in_port\":[{\"index\":0,\"line\":[],\"name\":\"POC2_IN\"}],\"ip_port\":\"localhost:8865\",\"model_name\":\"poc_forecastweather_atomic\",\"model_type\":1,\"models\":[],\"out_port\":[{\"index\":0,\"line\":[{\"from_obj_info\":{\"iid\":\"m2h4ji3eqooijsdxx\",\"port_name\":\"POC2_OUT\"},\"to_obj_info\":{\"iid\":\"m2h4jga3l7rsj72i0\",\"port_name\":\"POC1_IN\"},\"user_offset\":[0,0,0,0]}],\"name\":\"POC2_OUT\"}],\"position\":{\"x\":417.05365052727825,\"y\":50.322142407128204},\"uid\":\"m2h4ji3ejjcpx3ind\"},{\"color\":\"hsla(204, 100%, 50%, 1)\",\"file_name\":\"poc_carpark_atomic.dll\",\"file_path\":\"banksim9\",\"idx\":2,\"iid\":\"m2h4jjqd3uuptx5vl\",\"in_param\":[],\"in_port\":[{\"index\":0,\"line\":[],\"name\":\"POC4_IN\"}],\"ip_port\":\"localhost:8865\",\"model_name\":\"poc_carpark_atomic\",\"model_type\":1,\"models\":[],\"out_port\":[{\"index\":0,\"line\":[{\"from_obj_info\":{\"iid\":\"m2h4jjqd3uuptx5vl\",\"port_name\":\"POC4_OUT\"},\"to_obj_info\":{\"iid\":\"m2h4jga3l7rsj72i0\",\"port_name\":\"POC1_IN\"},\"user_offset\":[0,0,0,0]}],\"name\":\"POC4_OUT\"}],\"position\":{\"x\":527.01007320919723,\"y\":343.75614613224911},\"uid\":\"m2h4jjqdm12c1cyjv\"},{\"color\":\"hsla(75, 100%, 50%, 1)\",\"file_name\":\"poc_microdust_atomic.dll\",\"file_path\":\"banksim9\",\"idx\":3,\"iid\":\"m2h4jl6a88g1f1v1z\",\"in_param\":[],\"in_port\":[{\"index\":0,\"line\":[],\"name\":\"POC3_IN\"}],\"ip_port\":\"localhost:8865\",\"model_name\":\"poc_microdust_atomic\",\"model_type\":1,\"models\":[],\"out_port\":[{\"index\":0,\"line\":[{\"from_obj_info\":{\"iid\":\"m2h4jl6a88g1f1v1z\",\"port_name\":\"POC3_OUT\"},\"to_obj_info\":{\"iid\":\"m2h4jga3l7rsj72i0\",\"port_name\":\"POC1_IN\"},\"user_offset\":[0,0,0,0]}],\"name\":\"POC3_OUT\"}],\"position\":{\"x\":538.07077844939022,\"y\":214.28083184998954},\"uid\":\"m2h4jl6axq4xbn1zx\"}],\"out_port\":[],\"position\":{\"x\":396.46206824585204,\"y\":353.89731816758842},\"uid\":\"m2eopkx1t1aeabppx\"}],\"out_port\":[],\"position\":{\"x\":275.52476124150945,\"y\":359.08129185455556},\"uid\":\"m2h4is6uqen9vggwf\"}],\"out_port\":[],\"position\":{\"x\":150,\"y\":50},\"uid\":\"m2h4mo8avftxl18dy\"},\"msg\":\"load\",\"project_name\":\"banksim\"}";

		bool parsingSuccessful = reader.parse(aaa, args);
		if (!parsingSuccessful)
		{
			cout << "Error parsing the string" << endl;
		}

		spdlog::debug("{}::{}", Json::stringifyJson(args), __LINE__);
		if (!args.isMember(PROTOCOL::MODEL_INFO::PROJECT_NAME)) {
			spdlog::error("# ERROR] GUI::SIM_CTL::prj_is_null::{}", __LINE__);
			return 1;
		}
		string project_name = args[PROTOCOL::MODEL_INFO::PROJECT_NAME].asString();
		spdlog::debug("project_name = {}::{}", project_name, __LINE__);

		if (!args.isMember(PROTOCOL::GUI::SIM_CTL::MSG)) {
			spdlog::error("# ERROR] GUI::SIM_CTL::msg is null::{}", __LINE__);
			return 1;
		}
		string msg = args[PROTOCOL::GUI::SIM_CTL::MSG].asString();
		if (msg == PROTOCOL::GUI::SIM_CTL::SIM_LOAD) {
			std::string remote_ip_port = "test";
			//g_gui_clients[remote_ip_port].client_id = project_name;

			Json::Value body = args[PROTOCOL::MODEL_INFO::JSON_DATA];
			//sim_del_all();
			_sim_manager.sim_del(project_name);
			_sim_manager.sim_add(project_name);

			//_sim_manager.set_sim_gui(project_name, test);
			_sim_manager.load(project_name, body);
		}

		return 1;
	}
};
#endif