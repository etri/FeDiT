#include "sim_engine.h"
#include "request_validation.h"
#include <exception>
#include <iostream>
#include <fstream>
#include <thread>
#include <chrono>
#include "../common/common.h"
#include "sim_manager.h"
#include "../http_lib/web_client.h"
#include "atomic_imp.h"
#include "coupled_imp.h"
#include "embeded_func_imp.h"
#include "function_imp.h"
#define DEFAULT_CS_SIM_TIMESTEP	0.1

template<typename A, typename B>
std::pair<B, A> flip_pair(const std::pair<A, B>& p)
{
	return std::pair<B, A>(p.second, p.first);
}

template<typename A, typename B, template<class, class, class...> class M, class... Args>
std::multimap<B, A> flip_map(const M<A, B, Args...>& src)
{
	std::multimap<B, A> dst;
	std::transform(src.begin(), src.end(),
		std::inserter(dst, dst.begin()),
		flip_pair<A, B>);
	return dst;
}

sim_engine::sim_engine(const string& project_name)
{
	this->_sim_time = 0.0;
	this->_sim_end_time = 0.0;
	this->_project_name = project_name;
	this->_gui_project_name = project_name;
	this->_engine_state = ENGINE_STATE_STOP;
	this->_event_sync = CreateEvent(NULL, TRUE, FALSE, NULL);
	this->_event_engine_stop = CreateEvent(NULL, TRUE, FALSE, NULL);
	if (!_event_sync || !_event_engine_stop) {
		if (_event_sync) CloseHandle(_event_sync);
		if (_event_engine_stop) CloseHandle(_event_engine_stop);
		throw std::runtime_error("Could not create simulation synchronization events");
	}
	_req_load_models = 0;
	_loaded_models = 0;
}

sim_engine::~sim_engine()
{
	load_signal->cancel();
	if (this->_engine_state == ENGINE_STATE_RUN || this->_engine_state == ENGINE_STATE_PAUSE) {
		this->_engine_state = ENGINE_STATE_STOP_REQ;
		//pause ���� �̸� ����� setevent����� ��
	}
	spdlog::debug("# sim_engine::engine_stop::{}::{}", this->_project_name, __LINE__);
	stop();
	clear_model();
	/*spdlog::debug("# sim_engine::socket_release::" << this->_project_name,__LINE__);
	_websocket_client.disconnect();*/
	CloseHandle(this->_event_sync);
	CloseHandle(this->_event_engine_stop);
}

int sim_engine::run()
{
	if (_engine_state != ENGINE_STATE_STOP) return 0;
	if (_thread_instance.joinable()) _thread_instance.join();
	if (_models.empty()) {
		spdlog::warn("# sim_engine::run::no models::{}", _project_name);
		return 0;
	}
	// ��� �� �ε尡 �Ϸ�Ǿ����� �˻�
	for (auto& model : _models) {
		spdlog::debug("# sim_engine::run::model_type::{}::{}::{}::{}", model.second->_model_name,
			model.first, (int)model.second->_model_type, __LINE__);
		if (model.second->_model_type == model_t::MODEL_TYPE::UNKNOWN) {
			spdlog::debug("# ERROR] sim_engine::run::model_type is unknown::{}::{}", model.first, __LINE__);
			return 0;
		}
		else if (!model.second->is_loaded()) {
			spdlog::debug("# ERROR] sim_engine::run::model is not loaded::{}::{}::{}",
				model.first, (int)model.second->_model_type, __LINE__);
			return 0;
		}
	}
	_engine_state = ENGINE_STATE_RUN;
	ResetEvent(_event_engine_stop);
	try { _thread_instance = thread(&sim_engine::engine_run, this); }
	catch (...) { _engine_state = ENGINE_STATE_STOP; SetEvent(_event_engine_stop); throw; }
	return 1;
}

void sim_engine::set_sim_time(double start_time, double end_time)
{
	spdlog::info("# sim_engine::set_sim_time::{}-{}::{}", start_time, end_time, __LINE__);
	request_validation::times(start_time, end_time);
	add_event([this, start_time, end_time](Json::Value&) {
		_sim_time = start_time;
		_sim_end_time = end_time;
	});
}

int sim_engine::stop()
{
    if (_engine_state != ENGINE_STATE_STOP) _engine_state = ENGINE_STATE_STOP_REQ;
    SetEvent(_event_sync);
    if (_thread_instance.joinable()) _thread_instance.join();
    _engine_state = ENGINE_STATE_STOP;
    return 1;
}

int sim_engine::pause()
{
	if (_engine_state == ENGINE_STATE_RUN) _engine_state = ENGINE_STATE_PAUSE;
	return 0;
}

int sim_engine::add_model(model_t::MODEL_TYPE model_type, const string& iid, const string& uid, const string& model_name)
{
#ifdef _DEBUG
	spdlog::debug("# sim_engine::add_model::{}::{}::{}::{}",
		model_name, iid, uid, (int)model_type, __LINE__);
#endif
	add_event([this, model_type, iid, uid, model_name](Json::Value json) {
		const auto& model = _models.find(iid);
		if (model == _models.end()) {
			model_t* m = model_t::create_model(model_type);
			if (!m) throw std::invalid_argument("Unsupported model_type");
			m->_model_type = model_type;
			m->_model_name = model_name;
			m->_uid = uid;
			m->_iid = iid;
			m->_eng_ptr = this;
			_models[iid] = m;
			_modelsName[model_name] = m;
		}
		else {
			model->second->_model_type = model_type;

		}
		});
	return 1;
}

int sim_engine::add_model(connectionInfo conn_hdl, const Json::Value& args)
{
	const string& model_name = request_validation::text(args, PROTOCOL::JOIN::MODEL_INFO::MODEL_NAME);
	const string& iid = request_validation::text(args, PROTOCOL::JOIN::MODEL_INFO::IID);
	const string& uid = args[PROTOCOL::JOIN::MODEL_INFO::UID].asString();
	add_model(conn_hdl, iid, uid, model_name);
	return 1;
}

int sim_engine::add_model(connectionInfo conn_hdl, const string& iid, const string& uid, const string& model_name)
{
	add_event([this, conn_hdl, iid, uid, model_name](Json::Value json) {
		const auto& model = _models.find(iid);
		if (model == _models.end()) {
			atomic_imp* m = (atomic_imp*)model_t::create_model(model_t::MODEL_TYPE::ATOMIC);
			m->_model_name = model_name;
			m->_conn_hdl = conn_hdl;
			m->_iid = iid;
			m->_uid = uid;
			m->_eng_ptr = this;
			_models[iid] = m;
			_modelsName[model_name] = m;
		}
		else {
			auto atomic = dynamic_cast<atomic_imp*>(model->second);
			auto function = dynamic_cast<function_imp*>(model->second);
			if (atomic) atomic->_conn_hdl = conn_hdl;
			else if (function) function->_conn_hdl = conn_hdl;
			else throw std::invalid_argument("JOIN target is not an external model");
			/*if (!model->second->_init_param.isNull()) {
				MODEL_SOCKET.send_json(conn_hdl, PROTOCOL::PORT::IN_PARAM.c_str(), model->second->_init_param, 1);
			}*/
		}
        if (_joined_model_ids.insert(iid).second) ++_loaded_models;
        complete_local_load();
		});
	return 1;
}
bool sim_engine::accepts_model(const std::string& iid) const {
    if (_engine_state != ENGINE_STATE_STOP) return false;
    const auto found = _models.find(iid);
    return found != _models.end() &&
        (dynamic_cast<atomic_imp*>(found->second) || dynamic_cast<function_imp*>(found->second));
}

void sim_engine::complete_local_load() {
    if (_loaded_models >= _req_load_models && load_signal->notify()) {
        Json::Value res;
        res["project_name"] = _gui_project_name;
        res[PROTOCOL::SIM_CTL::RUN_ID] = _run_id;
        res[PROTOCOL::SIM_CTL::SIM_LOAD] = "ok";
        GUI_SOCKET.send_json(get_gui_handle(), PROTOCOL::GUI::RES_M::TYPE.c_str(), res, 1);
    }
}

void sim_engine::model_exec(model_t::MODEL_TYPE model_type, const string& ip_and_port, const string& file_path, const string& file_name
	, const string& model_name, const string& iid, const string& uid, const Json::Value init_param, const string& server_address) {
	if (load_signal->is_cancelled()) throw std::runtime_error("Model load cancelled");
	int find_dot = file_name.rfind(".");
	string file_ext = file_name;
	auto model = _models.find(iid);
	if (model == _models.end()) {
		model_t* m = model_t::create_model(model_type);
		if (!m) throw std::invalid_argument("Unsupported model_type");
		m->_eng_ptr = this;
		m->_model_name = model_name;
		m->_iid = iid;
		m->_uid = uid;
		_models[iid] = m;
		_modelsName[model_name] = m;
		model = _models.find(iid);
	}

	if (find_dot != string::npos) {
		file_ext = file_name.substr(find_dot + 1);
		if ((model_type == model_t::MODEL_TYPE::UNKNOWN || model_type == model_t::MODEL_TYPE::COUPLED) && file_ext == "json") {
			model->second->_model_type = model_t::MODEL_TYPE::COUPLED;
			if (!add_model(file_path, file_name, model_name, iid, uid))
				throw std::runtime_error("Nested model load failed");
			return;
		}
	}

	model->second->_init_param = init_param;
	//spdlog::info("{}Param : {}{}", spdlog::ctl::green, Json::stringifyJson(init_param), spdlog::ctl::reset);
	Json::Value model_info;
	model_info[PROTOCOL::ATOMIC::MODEL_INFO::PROJECT_NAME] = _project_name;
	model_info[PROTOCOL::ATOMIC::MODEL_INFO::FILE_NAME] = file_name;
	model_info[PROTOCOL::ATOMIC::MODEL_INFO::FILE_PATH] = file_path;
	model_info[PROTOCOL::ATOMIC::MODEL_INFO::MODEL_NAME] = model_name;
	model_info[PROTOCOL::ATOMIC::MODEL_INFO::IID] = iid;
	model_info[PROTOCOL::ATOMIC::MODEL_INFO::UID] = uid;
	model_info[PROTOCOL::ATOMIC::CMD] = PROTOCOL::ATOMIC::EXEC;
	model_info[PROTOCOL::MODEL_INFO::SERVER_IP] = server_address.empty() ? SIM_MANAGER.model_server_address : server_address;
	_req_load_models++;
	model->second->load(ip_and_port, model_info);
	if (model_type >= model_t::MODEL_TYPE::EMBEDED_FUNC) {
		_req_load_models--;//�Ӻ���� ���� ����
		add_model(model_type, iid, uid, model_name);
	}

}

int sim_engine::add_model(const Json::Value& coupled_model_info)
{
	request_validation::model(coupled_model_info);
	string iid = coupled_model_info.get(PROTOCOL::COUPLED::MODEL_INFO::IID, "").asString();
	string uid = coupled_model_info.get(PROTOCOL::COUPLED::MODEL_INFO::UID, "").asString();
	string model_name = coupled_model_info.get(PROTOCOL::COUPLED::MODEL_NAME, "").asString();

	
	add_event([this, model_name, iid, uid](Json::Value& cpd_model_info)
        {
            // Also bound recursion through coupled documents fetched over HTTP.
            static thread_local unsigned load_depth = 0;
            if (load_depth >= 64) throw std::invalid_argument("Cyclic or excessively nested coupled model");
            struct depth_scope {
                unsigned& depth;
                explicit depth_scope(unsigned& value) : depth(value) { ++depth; }
                ~depth_scope() { --depth; }
            } depth_guard(load_depth);
			unordered_map<string, model_t*>::iterator model = _models.find(iid);
			if (model == _models.end()) {
				coupled_imp* m = new coupled_imp;
				m->_model_name = model_name;
				m->_eng_ptr = this;
				_models[iid] = m;
				model = _models.find(iid);
				spdlog::debug("# sim_engine::add_model::create_cpd::{}::{}::{}", model_name, iid, __LINE__);
			}
			coupled_imp* model_ptr = dynamic_cast<coupled_imp*>(model->second);
			if (!model_ptr) {
				spdlog::error("# ERROR] sim_engine::add_model::model_ptr is null[{}::{}::{}::{}]",
					model_name, iid, uid, __LINE__);
				return;
			}
			// coupled_model_info�� ������ �������� ���� �𵨵� �ε�
			const Json::Value& child_models = cpd_model_info.get(PROTOCOL::COUPLED::CHILD_MODELS, Json::Value());
			for (const auto& m : child_models) {
				string file_name = m.get(PROTOCOL::COUPLED::MODEL_INFO::FILE_NAME, "").asString();
				string file_path = m.get(PROTOCOL::COUPLED::MODEL_INFO::FILE_PATH, "").asString();
				string child_iid = m.get(PROTOCOL::COUPLED::MODEL_INFO::IID, "").asString();
				string child_uid = m.get(PROTOCOL::COUPLED::MODEL_INFO::UID, "").asString();
				model_t::MODEL_TYPE child_model_type = (model_t::MODEL_TYPE)m.get(PROTOCOL::COUPLED::MODEL_INFO::MODEL_TYPE, 0).asInt();
				string ip = m.get(PROTOCOL::COUPLED::MODEL_INFO::IP_PORT, "localhost:8864").asString();
				Json::Value init_param;
				if (m.isMember(PROTOCOL::COUPLED::PORT::IN_PARAM)) {
					init_param = m[PROTOCOL::COUPLED::PORT::IN_PARAM];
				}
				if (m[PROTOCOL::COUPLED::MODEL_INFO::MODEL_NAME].isArray()) {//�̰� ��а� XXXXXXXXXXXXX
					for (const auto& mm : m[PROTOCOL::COUPLED::MODEL_INFO::MODEL_NAME]) {
						string model_name = mm.asString();

						child_iid = mm.get(PROTOCOL::COUPLED::MODEL_INFO::IID, "").asString();
						//model->second._child_models.push_back(model_name);
						model_exec(child_model_type, ip, file_path, file_name, model_name, iid, child_uid, init_param, m.get(PROTOCOL::MODEL_INFO::SERVER_IP, "").asString());

					}
				}
				else {
					string model_name = m.get(PROTOCOL::COUPLED::MODEL_INFO::MODEL_NAME, "").asString();
					model_ptr->_child_models.push_back(model_name);
					if (child_model_type == model_t::MODEL_TYPE::COUPLED) {
						add_model(m);
					}
					else {
						model_exec(child_model_type, ip, file_path, file_name, model_name, child_iid, child_uid, init_param, m.get(PROTOCOL::MODEL_INFO::SERVER_IP, "").asString());
						add_couple(m);
					}
				}
			}
			add_couple(cpd_model_info);
		}, coupled_model_info);
	return 1;
}

// �̻��
int sim_engine::add_model(const string& file_path, const string& json_file, const string& model_name, const string& iid, const string& uid)
{

	spdlog::debug("# sim_engine::{}add_model{}::{}/{}/{}/{}/{}", spdlog::ctl::red, spdlog::ctl::reset, file_path, json_file, model_name, iid, uid);
	// The endpoint used to be hardcoded to U("http://dev.kdtlab.kr:30001/get_model_info").
	// That host is not reachable from this deployment, so every nested coupled model
	// (e.g. bank_cpd.json, ef_cpd.json) failed here and only the top-level models were
	// loaded -- the "not all models show up after Push" symptom. Build the URL from
	// db_uri instead so it follows whichever host this server is deployed on.
	// db_uri is ASCII, so the same widening idiom used below for the parameters is fine.
	const string model_info_url = db_uri + "/get_model_info";
	wstring wmodel_info_url;
	wmodel_info_url.assign(model_info_url.begin(), model_info_url.end());
	http_client_config config;
	config.set_timeout(std::chrono::seconds(15));
	http_client client(wmodel_info_url, config);
	json::value json_return;
	auto param = json::value::object();
	wstring wfile_path;
	wfile_path.assign(file_path.begin(), file_path.end());
	wstring wjson_file;
	wjson_file.assign(json_file.begin(), json_file.end());
	param[L"project_name"] = json::value::string(wfile_path);
	param[L"file_name"] = json::value::string(wjson_file);
	wstring wuid;
	wuid.assign(uid.begin(), uid.end());
	param[L"uid"] = json::value::string(wuid);
	string ret;
	web_client::make_request(client, methods::POST, param, ret);
	//spdlog::debug("ret << endl,__LINE__);
	Json::Value ret_json = Json::parseJson(ret);
	if (!ret_json.isMember("data")) {
		// Log the URL and the raw reply. Without them this failure is invisible: the
		// nested coupled model is simply skipped and the GUI shows only part of the
		// model tree, with no indication that anything went wrong.
		spdlog::error("# ERROR] sim_engine::add_model::no 'data' in reply::url={}::project={}::file={}::model={}::uid={}::reply={}::{}"
			, model_info_url, file_path, json_file, model_name, uid, ret, __LINE__);
		return 0;
	}
	// An existing-but-empty result set means the DB has no such coupled model for this
	// project/file/uid. Reading [0][0] blindly would yield an empty json_data and load
	// an empty sub-tree, which again looks like "some models are missing".
	const string cpd_json_data = ret_json["data"][0][0]["json_data"].asString();
	if (cpd_json_data.empty()) {
		spdlog::error("# ERROR] sim_engine::add_model::empty json_data::url={}::project={}::file={}::model={}::uid={}::{}"
			, model_info_url, file_path, json_file, model_name, uid, __LINE__);
		return 0;
	}
	Json::Value cpd = Json::parseJson(cpd_json_data);

	if (model_name != "")
		cpd[PROTOCOL::COUPLED::MODEL_NAME] = model_name;
	if (iid != "")
		cpd[PROTOCOL::COUPLED::MODEL_INFO::IID] = iid;
	if (uid != "")
		cpd[PROTOCOL::COUPLED::MODEL_INFO::UID] = uid;
	return add_model(cpd);
}

int sim_engine::clear_model()
{
	add_event([this](Json::Value json) {
		spdlog::debug("# sim_engine::clear_model", __LINE__);
		if (this->_engine_state == ENGINE_STATE_RUN)
			this->_engine_state = ENGINE_STATE_STOP_REQ;

		//this->_models.begin()->second->release();
		
		for (auto& m : this->_models) {
			// �� ���� ����
			m.second->release();
            _modelsName.erase(m.second->_model_name);
            // Connection ownership makes cleanup independent of a delayed KILL.
            delete m.second;
			m.second = nullptr;
		}

		this->_models.clear();
		_model_ta.clear();
		_continuous_model_ta.clear();

		});
	_req_load_models = 0;
	_loaded_models = 0;
	_joined_model_ids.clear();
	return 1;
}

int sim_engine::remove_model_req(const string& model_id, bool immediate)
{
	if (immediate)
		return remove_model(model_id);
	else {
		add_event([this, model_id](Json::Value json) {
			spdlog::debug("# sim_engine::remove_model::{}::{}", model_id, __LINE__);
			remove_model(model_id);
			});
	}
	return 1;
}

int sim_engine::remove_model(const string& model_id, unsigned depth)
{
	if (depth > 64) throw std::invalid_argument("Cyclic or excessively nested model removal");
	if (this->_models.count(model_id) == 0)
		return 0;
	if (this->_models[model_id]->_model_type == model_t::MODEL_TYPE::COUPLED) {// �ڽ� ���� ������
		coupled_imp* model_ptr = (coupled_imp*)this->_models[model_id];
		for (const auto& child_model : model_ptr->_child_models) {
			remove_model(child_model, depth + 1);
		}
	}
	// Ŀ�ø� ���̺����� ����
	this->remove_couple("", "", model_id, "");//����, �����Ʈ ���
	// �� ���� ����
	this->_models[model_id]->release();
    _modelsName.erase(this->_models[model_id]->_model_name);
    delete this->_models[model_id];
	this->_models.erase(model_id);
	_model_ta.erase(model_id);
	_continuous_model_ta.erase(model_id);
	return 1;
}

void sim_engine::print_list_models()
{
	add_event([this](Json::Value&) {
	std::cout << "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@" << endl;
	std::cout << "# sim_engine::print_list_models" << endl;
	std::cout << "# models = " << _models.size() << endl;
	for (const auto& model : _models) {
		std::cout << "  " << model.second->_model_name << "(" << model.first << ")::" << (int)model.second->_model_type << endl;
		for (const auto& cpd : model.second->_coupled_info) {
			std::cout << "     L " << cpd.first << endl;
			for (const auto& dest : cpd.second.dest_model_ports) {
				std::cout << "       -> " << _models.at(dest.first)->_model_name << "(" << dest.first << ")::" << dest.second << endl;
			}
		}
	}
	});
}

void sim_engine::add_out_msg(const Json::Value& msg)
{
	spdlog::debug("# sim_engine::add_out_msg::{}", __LINE__);
	//if (msg.get(PROTOCOL::EXT_TRANS::OPTION, "").asString() == "immediate") {
		//call_ext_trans(msg);//��� ó������
	//}
	//else
	if (!msg.isObject() || !msg[PROTOCOL::EXT_TRANS::PORT::OUT_PORT].isArray())
		throw std::invalid_argument("Invalid external transition ports");
	std::lock_guard<std::mutex> lock(_mutex);
	_ext_trans_msg.push_back(msg);
}



void sim_engine::ack(const Json::Value& msg)
{
	string model_name = msg.get(PROTOCOL::MODEL_INFO::MODEL_NAME, "").asString();
	spdlog::debug("# sim_engine::ack::{}", model_name);
	add_recv_packet([this](Json::Value msg) {
		}, msg);

	signal_ack();
}

void sim_engine::tar(const Json::Value& msg)
{
	string model_name = msg.get(PROTOCOL::MODEL_INFO::MODEL_NAME, "").asString();
	spdlog::debug("# sim_engine::tar::{}", model_name);
	add_recv_packet([this](Json::Value msg) {

		string iid = msg.get(PROTOCOL::MODEL_INFO::IID, "").asString();

		string model_name = msg.get(PROTOCOL::MODEL_INFO::MODEL_NAME, "").asString();

		auto model = _models.find(iid);
		if (model == _models.end() || !model->second)
			throw std::invalid_argument("TAR references an unknown model");
		double ta = request_validation::number(msg, PROTOCOL::TAR::SIM_TIME, Infinity);
		if (ta < 0) throw std::invalid_argument("Negative time advance");
		if (ta < Infinity)
			ta = _sim_time + ta;

		//spdlog::debug("# sim_engine::tar::" << model_name,iid,ta,__LINE__);


		_model_ta[iid] = ta;
		}, msg);
	signal_ack();
}

void sim_engine::set_gui_handle(connectionInfo handle)
{
	std::lock_guard<std::mutex> lock(_mutex);
	_gui_handle = handle;
}

connectionInfo sim_engine::get_gui_handle()
{
	std::lock_guard<std::mutex> lock(_mutex);
	return _gui_handle;
}

int sim_engine::engine_run()
{
	bool failed = false;
	try {
		spdlog::info("# sim_engine::engine_run::state::run");
		{
			std::lock_guard<std::mutex> lock(_mutex);
			_event_table.clear();
			_recv_packet_buff.clear();
		}
		MODEL_SOCKET.clear_send_buff(_project_name);
		ResetEvent(this->_event_sync);
		_ack_count = 0;
		for (auto& model : _models) {
			if (model.second->_model_type == model_t::MODEL_TYPE::COUPLED) // Ŀ�ø��� �н�
				continue;

			if (model.second->_model_type == model_t::MODEL_TYPE::CONTINUOUS)
			{
				_continuous_model_ta[model.first] = 0.0;//�ʱ� ��� �𵨵� ta�� ��������
			}

			else
			{
				_model_ta[model.first] = 0.0;//�ʱ� ��� �𵨵� ta�� ��������
			}
							//���� ��� �𵨵� TA�� ��������
				Json::Value msg;
				msg[PROTOCOL::MODEL_INIT::SIM_TIME] = _sim_time;
				if (model.second->call_init(_project_name, msg) == 1) {
					//_mutex.lock();
					_ack_count++;//����޾ƾ� �� �� ��
					//_mutex.unlock();
				}
				else {
					_model_ta[model.first] = Infinity;
				}
				//MODEL_SOCKET.send_json(model.second._conn_hdl, PROTOCOL::MODEL_INIT::TYPE.c_str(), msg);

			////���� ��� �𵨵� TA�� ��������
			//Json::Value msg;
			//msg[PROTOCOL::MODEL_INIT::SIM_TIME] = _sim_time;
			//if (model.second->call_init(msg) == 1) {
			//	//_mutex.lock();
			//	_ack_count++;//����޾ƾ� �� �� ��
			//	//_mutex.unlock();
			//}
			//else {
			//	_model_ta[model.first] = Infinity;
			//}
			////MODEL_SOCKET.send_json(model.second._conn_hdl, PROTOCOL::MODEL_INIT::TYPE.c_str(), msg);
		}


		if (_ack_count > 0) {
			MODEL_SOCKET.flush_send_buff(_project_name);
			spdlog::debug("# sim_engine::engine_run::wait_ack::{}", _ack_count.load());
			DWORD client_state = wait_for_ack();
			if (WAIT_TIMEOUT == client_state) {//������ ������ ���� �ʾҴ�
				spdlog::error("# sim_engine::engine_run::wait_init_ack::time_out::{}", __LINE__);
			}
		}
		process_events(_recv_packet_buff);


		clock_t start_time = clock();
		double discrete_next_time;
		double continuous_next_time = 0;
		double continuous_time = 0;
		while (1) {
			if (_sim_time >= _sim_end_time)
				break;
			if (_engine_state == ENGINE_STATE_STOP_REQ)
				break;


			
			spdlog::debug("##################################################################################");
		
			multimap<double, string> ordered_ta = flip_map(_model_ta);
			if (ordered_ta.empty() && _continuous_model_ta.empty()) break;
			discrete_next_time = ordered_ta.empty() ? Infinity : ordered_ta.begin()->first;

			bool continuousRun = false;

			if (discrete_next_time < continuous_next_time)
			{
				_sim_time = discrete_next_time;
			}
			else
			{
				_sim_time = continuous_next_time;
				continuousRun = true;
				continuous_next_time += DEFAULT_CS_SIM_TIMESTEP;
			}
			if (continuousRun == true)
			{
				while (continuous_time < continuous_next_time)
				{
					_ack_count = 0;
					ResetEvent(this->_event_sync);
					Json::Value msg;
					msg[PROTOCOL::TIME_ADVANCE::SIM_TIME] = continuous_time;
					for (const auto& model_ta : _continuous_model_ta) {
						if (_engine_state == ENGINE_STATE_STOP_REQ)
						{
							break;
						}

						auto model_it = _models.find(model_ta.first);
						if (model_it == _models.end() || !model_it->second) continue;
						auto model = model_it->second;

						//MODEL_SOCKET.send_json(model._conn_hdl, PROTOCOL::TIME_ADVANCE::TYPE.c_str(), msg);
						if (model->call_int_trans_fn(_project_name, msg) > 0) {
							//_mutex.lock();
							_ack_count++;//����޾ƾ� �� �� ��
							//_mutex.unlock();
						}
					}
					

					if (_ack_count > 0) {
						MODEL_SOCKET.flush_send_buff(_project_name);
						spdlog::debug("# sim_engine::engine_run::wait_ack::{}", _ack_count.load());

						DWORD client_state = wait_for_ack();
						if (WAIT_TIMEOUT == client_state) {//������ ������ ���� �ʾҴ�
							spdlog::error("# sim_engine::engine_run::wait_ack::time_out::{}", __LINE__);
						}
					}
					continuous_time += DEFAULT_CS_SIM_TIMESTEP;
				}
			}

				//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				_ack_count = 0;
				ResetEvent(this->_event_sync);
				Json::Value msg;
				msg[PROTOCOL::TIME_ADVANCE::SIM_TIME] = _sim_time;
				for (const auto& model_ta : ordered_ta) {
					if (_engine_state == ENGINE_STATE_STOP_REQ)
						break;
					if (model_ta.first > _sim_time)
						break;
					auto model_it = _models.find(model_ta.second);
					if (model_it == _models.end() || !model_it->second) continue;
					auto model = model_it->second;
					spdlog::debug("# t={}] sim_engine::engine_run::{}",
						_sim_time, model_ta.second, model->_model_name);

					//MODEL_SOCKET.send_json(model._conn_hdl, PROTOCOL::TIME_ADVANCE::TYPE.c_str(), msg);
					if (model->call_int_trans_fn(_project_name, msg) > 0) {
						//_mutex.lock();
						_ack_count++;//����޾ƾ� �� �� ��
						//_mutex.unlock();
					}
				}
		
				if (_ack_count > 0) {
					MODEL_SOCKET.flush_send_buff(_project_name);
					spdlog::debug("# sim_engine::engine_run::wait_ack::{}", _ack_count.load());

					DWORD client_state = wait_for_ack();
					if (WAIT_TIMEOUT == client_state) {//������ ������ ���� �ʾҴ�
						spdlog::error("# sim_engine::engine_run::wait_ack::time_out::{}", __LINE__);
					}
				}
				if (_engine_state == ENGINE_STATE_STOP_REQ || _engine_state == ENGINE_STATE_STOP)
					break;
				process_events(_recv_packet_buff);

				while (true) {
					vector<Json::Value> ex_msgs;
					{ std::lock_guard<std::mutex> lock(_mutex); ex_msgs.swap(_ext_trans_msg); }
					if (ex_msgs.empty()) break;
					ResetEvent(this->_event_sync);
					_ack_count = 0;
					spdlog::debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
					spdlog::debug("# sim_engine::engine_run::message relay({})", ex_msgs.size());
					
					auto iter = ex_msgs.begin();
					for (; iter != ex_msgs.end(); iter++) {
						if (_engine_state == ENGINE_STATE_STOP_REQ)
							break;
						/*if (get<0>(*iter) > _sim_time) {
							iter--;
							break;
						}*/

						call_ext_trans(*iter);
					}
					ex_msgs.clear();
					//_ext_trans_msg.erase(_ext_trans_msg.begin(), iter);
					spdlog::debug("# sim_engine::engine_run::wait_ext_ack::{}", _ack_count.load());


					if (_ack_count > 0) {
						MODEL_SOCKET.flush_send_buff(_project_name);
						DWORD client_state = wait_for_ack();
						if (WAIT_TIMEOUT == client_state) {//������ ������ ���� �ʾҴ�
							spdlog::error("# WARNING] sim_engine::engine_run::wait_ext::time_out::{}", __LINE__);
						}
					}
					if (_engine_state == ENGINE_STATE_STOP_REQ || _engine_state == ENGINE_STATE_STOP)
						break;
					process_events(_recv_packet_buff);
				}
				if (_engine_state == ENGINE_STATE_STOP_REQ || _engine_state == ENGINE_STATE_STOP)
					break;
				//////////////////////////////////////////////////////////////////////////////////////////
				// ������ ó���ؾ� �� �̺�Ʈ ������ ó��
				spdlog::debug("******************************************");
				process_events(_event_table);

		
		}//end of while
		clock_t end_time = clock();
		spdlog::info("{}# simulation end::total run time::{}sec::{}{}", spdlog::ctl::red, (end_time - start_time) * 0.001, __LINE__, spdlog::ctl::reset);
	}
	catch (const exception& e) {
		failed = true;
		spdlog::error("error : {}::{}", e.what(), __LINE__);
	}
	catch (...) {
		failed = true;
		spdlog::error("unknown error::{}", __LINE__);
	}

    try {
        Json::Value res;
        res["project_name"] = _gui_project_name;
        res[PROTOCOL::SIM_CTL::SIM_STOP] = failed ? "error" : "ok";
        res[PROTOCOL::SIM_CTL::RUN_ID] = _run_id;
        GUI_SOCKET.send_json(get_gui_handle(), PROTOCOL::GUI::RES_M::TYPE.c_str(), res, 1);
    }
    catch (const std::exception& e) { spdlog::error("# engine stop notification failed: {}", e.what()); }
    catch (...) { spdlog::error("# engine stop notification failed"); }
    _engine_state = ENGINE_STATE_STOP;
    SetEvent(_event_engine_stop);

	return 0;
}



//int sim_engine::add_couple(connectionInfo src_conn_hdl, const string& src_model_id, const string& src_port, connectionInfo dest_conn_hdl, const string& dest_model_id, const string& dest_port)
//{
//	if (_models.count(src_model_id) == 0) {
//		model_t model;
//		model._model_name = src_model_id;
//		model._conn_hdl = src_conn_hdl;
//		_models[src_model_id] = model;
//	}
//	spdlog::debug("# sim_engine::add_couple::" << src_model_id << "(" << src_port << ")->" << dest_model_id << "(" << dest_port << ")",__LINE__);
//	_models[src_model_id]._coupled_info[src_port].add_couple(dest_model_id, dest_port);
//	return 1;
//}

int sim_engine::add_couple(const Json::Value& model_info)
{
	string iid = model_info.get(PROTOCOL::COUPLED::MODEL_INFO::IID, "").asString();
	const Json::Value& in_ports = model_info.get(PROTOCOL::COUPLED::PORT::IN_PORT, Json::Value());
	for (const auto& port : in_ports) {
		const Json::Value& lines = port.get(PROTOCOL::COUPLED::PORT::LINE, Json::Value());
		for (const auto& line : lines) {
			const auto& from_obj = line.get(PROTOCOL::COUPLED::PORT::FROM_OBJ_INFO, Json::Value());
			const auto& from_obj_iid = from_obj.get(PROTOCOL::COUPLED::MODEL_INFO::IID, "").asString();
			if (from_obj_iid == "this" || from_obj_iid == iid) {
				// exin
				const auto& from_obj_port = from_obj.get(PROTOCOL::COUPLED::PORT::PORT_NAME, "").asString();
				const auto& to_obj = line.get(PROTOCOL::COUPLED::PORT::TO_OBJ_INFO, Json::Value());
				const auto& to_obj_iid = to_obj.get(PROTOCOL::COUPLED::MODEL_INFO::IID, "").asString();
				const auto& to_obj_port = to_obj.get(PROTOCOL::COUPLED::PORT::PORT_NAME, "").asString();
				add_couple(iid, from_obj_port, to_obj_iid, to_obj_port);
			}
		}// end of for lines
	}//end of for ports

	const Json::Value& out_ports = model_info.get(PROTOCOL::COUPLED::PORT::OUT_PORT, Json::Value());
	for (const auto& port : out_ports) {
		const Json::Value& lines = port.get(PROTOCOL::COUPLED::PORT::LINE, Json::Value());
		for (const auto& line : lines) {
			const auto& from_obj = line.get(PROTOCOL::COUPLED::PORT::FROM_OBJ_INFO, Json::Value());
			const auto& from_obj_iid = from_obj.get(PROTOCOL::COUPLED::MODEL_INFO::IID, "").asString();
			if (from_obj_iid == "this" || from_obj_iid == iid) {
				// out
				const auto& from_obj_port = from_obj.get(PROTOCOL::COUPLED::PORT::PORT_NAME, "").asString();
				const auto& to_obj = line.get(PROTOCOL::COUPLED::PORT::TO_OBJ_INFO, Json::Value());
				const auto& to_obj_iid = to_obj.get(PROTOCOL::COUPLED::MODEL_INFO::IID, "").asString();
				const auto& to_obj_port = to_obj.get(PROTOCOL::COUPLED::PORT::PORT_NAME, "").asString();
				add_couple(iid, from_obj_port, to_obj_iid, to_obj_port);
			}
		}// end of for lines
	}//end of for ports
	return 1;
}

int sim_engine::add_couple(const string& src_model_id, const string& src_port, const string& dest_model_id, const string& dest_port)
{
	const auto& src_model = _models.find(src_model_id);
	if (src_model != _models.end()) {
		src_model->second->_coupled_info[src_port].add_couple(dest_model_id, dest_port);
	}
	else {
		spdlog::error("# sim_engine::add_couple::exception::src_model({}) not loaded::{}",
			src_model_id, __LINE__);
		return 0;
		/*model_t m;
		m._model_name = src_model_id;
		m._coupled_info[src_port].add_couple(dest_model_id, dest_port);
		m._eng_ptr = this;
		_models[src_model_id] = m;*/
	}

	return 1;
}

void sim_engine::call_ext_trans(const Json::Value& msg)
{
	double sim_time = msg.get(PROTOCOL::EXT_TRANS::SIM_TIME, INFINITY).asDouble();
	string model = msg.get(PROTOCOL::MODEL_INFO::IID, "").asString();
	Json::Value port_array = msg[PROTOCOL::EXT_TRANS::PORT::OUT_PORT];
	for (int i = 0; i < port_array.size(); i++) {
		string port = port_array[i].get(PROTOCOL::EXT_TRANS::PORT::PORT_VAL::NAME, "").asString();
		string to_model = port_array[i].get(PROTOCOL::EXT_TRANS::PORT::PORT_VAL::DEST_MODEL, "").asString();
		port_array[i][PROTOCOL::EXT_TRANS::SIM_TIME] = _sim_time;
		port_array[i][PROTOCOL::PORT::PORT_VAL::SRC_MODEL] = model;
		port_array[i][PROTOCOL::MODEL_INFO::MODEL_TYPE] = msg.get(PROTOCOL::MODEL_INFO::MODEL_TYPE, 0).asInt();
		send_ext_trans_msg(model, port, to_model, port_array[i]);

	}

}

void sim_engine::remove_couple(const string& src_model_id, const string& src_port, const string& dest_model_id, const string& dest_port)
{
	if (src_model_id == "") {//��� �� ���
		for (auto& model : _models) {
			model.second->remove_couple(src_port, dest_model_id, dest_port);
		}
	}
	else {
		if (_models.count(src_model_id) > 0)
			_models[src_model_id]->remove_couple(src_port, dest_model_id, dest_port);
	}
}

void sim_engine::send_ext_trans_msg(const string& src_model_id, const string& src_model_port, const string& dest_model, Json::Value& msg, unsigned depth)
{
	if (depth > 64) throw std::invalid_argument("Cyclic or excessively nested model coupling");
	if (_models.count(src_model_id) > 0) {
		spdlog::debug("# sim_engine::send_ext_trans_msg::{}({})::{}->{}::{}",
			_models[src_model_id]->_model_name, src_model_id, src_model_port, dest_model, __LINE__);
		auto iter = _models[src_model_id]->_coupled_info.find(src_model_port);
		if (iter != _models[src_model_id]->_coupled_info.end()) {
			msg[PROTOCOL::COUPLED::COUPLE_INFO::SRC_MODEL_PORT] = src_model_port;
			for (auto& dest : iter->second.dest_model_ports) {
				if (_models.count(dest.first) == 0)
					continue;
				auto& model = _models[dest.first];
				if (model->_model_type == model_t::MODEL_TYPE::COUPLED) {//Ŀ�ø��ϰ��
					send_ext_trans_msg(dest.first, dest.second, dest_model, msg, depth + 1);//Ŀ�ø��ϰ�� unicast�� ���� ���� Ŀ�ø𵨱��� Ž��
				}
				else if (dest_model != "" && dest_model != dest.first)//unicast �ϰ�� to_model_name �̶� ���� ������ pass
					continue;
				else {
					msg[PROTOCOL::MODEL_INFO::IID] = dest.first;
					msg[PROTOCOL::EXT_TRANS::PORT::PORT_VAL::NAME] = dest.second;
					spdlog::debug("# sim_engine::send_ext_trans_msg::to::{}::{}::{}",
						dest.first, Json::stringifyJson(msg), (int)model->_model_type, __LINE__);
					if (model->call_ext_trans_fn(_project_name, msg) == 1) {
						//_mutex.lock();
						_ack_count++;//����޾ƾ� �� �� ��
						//_mutex.unlock();
					}
					//MODEL_SOCKET.send_json(model._conn_hdl, PROTOCOL::EXT_TRANS::TYPE.c_str(), msg);
				}
			}
		}
	}
}

//int sim_engine::update_modelparam(const Json::Value& coupled_model_info)
//{
//	
//		string iid = coupled_model_info.get(PROTOCOL::COUPLED::MODEL_INFO::IID, "").asString();
//		string uid = coupled_model_info.get(PROTOCOL::COUPLED::MODEL_INFO::UID, "").asString();
//		string model_name = coupled_model_info.get(PROTOCOL::COUPLED::MODEL_NAME, "").asString();
//
//	add_event([this, model_name, iid, uid](Json::Value& cpd_model_info)
//		{
//
//			// coupled_model_info�� ������ �������� ���� �𵨵� �ε�
//			const Json::Value& child_models = cpd_model_info.get(PROTOCOL::COUPLED::CHILD_MODELS, Json::Value());
//			for (const auto& m : child_models) {
//				string file_name = m.get(PROTOCOL::COUPLED::MODEL_INFO::FILE_NAME, "").asString();
//				string file_path = m.get(PROTOCOL::COUPLED::MODEL_INFO::FILE_PATH, "").asString();
//				string child_iid = m.get(PROTOCOL::COUPLED::MODEL_INFO::IID, "").asString();
//				string child_uid = m.get(PROTOCOL::COUPLED::MODEL_INFO::UID, "").asString();
//				model_t::MODEL_TYPE child_model_type = (model_t::MODEL_TYPE)m.get(PROTOCOL::COUPLED::MODEL_INFO::MODEL_TYPE, 0).asInt();
//				string ip = m.get(PROTOCOL::COUPLED::MODEL_INFO::IP_PORT, "localhost:8864").asString();
//				Json::Value init_param;
//				if (m.isMember(PROTOCOL::COUPLED::PORT::IN_PARAM)) {
//					init_param = m[PROTOCOL::COUPLED::PORT::IN_PARAM];
//					auto model = _models.find(child_iid);
//					if (model != _models.end()) {
//						model->second->_init_param = init_param;
//					}
//				}
//
//					string model_name = m.get(PROTOCOL::COUPLED::MODEL_INFO::MODEL_NAME, "").asString();
//					if (child_model_type == model_t::MODEL_TYPE::COUPLED) {
//						update_modelparam(m);
//					}
//			}
//		}, coupled_model_info);
//	return 1;
//}

int sim_engine::update_modelparam(const Json::Value& coupled_model_info)
{
	request_validation::model(coupled_model_info);
	string model_name = coupled_model_info.get(PROTOCOL::COUPLED::MODEL_NAME, "").asString();
	double end_t = coupled_model_info.get(PROTOCOL::GUI::SIM_CTL::END_TIME, 0.0).asDouble();
	set_sim_time(0.0, end_t);
	add_event([this, model_name](Json::Value& cpd_model_info)
		{
			// coupled_model_info�� ������ �������� ���� �𵨵� �ε�
			const Json::Value& child_models = cpd_model_info.get(PROTOCOL::COUPLED::CHILD_MODELS, Json::Value());

			for (const auto& m : child_models) {
				string model_name = m.get(PROTOCOL::COUPLED::MODEL_INFO::MODEL_NAME, "").asString();
				Json::ArrayIndex child_models_Count = m.get(PROTOCOL::COUPLED::CHILD_MODELS, Json::Value()).size();

				Json::Value init_param;
				if (m.isMember(PROTOCOL::COUPLED::PORT::IN_PARAM)) {
					init_param = m[PROTOCOL::COUPLED::PORT::IN_PARAM];
					auto model = _modelsName.find(model_name);
					if (model != _modelsName.end()) {
						model->second-> _init_param= init_param;
					}
				}

				if (child_models_Count != 0) {
					update_modelparam(m);
				}
			}
		}, coupled_model_info);
	return 1;
}
//int sim_engine::update_modelparam(const Json::Value& coupled_model_info)
//{
//
//	string iid = coupled_model_info.get(PROTOCOL::COUPLED::MODEL_INFO::IID, "").asString();
//	string uid = coupled_model_info.get(PROTOCOL::COUPLED::MODEL_INFO::UID, "").asString();
//	string model_name = coupled_model_info.get(PROTOCOL::COUPLED::MODEL_NAME, "").asString();
//
//	add_event([this, model_name, iid, uid](Json::Value& cpd_model_info)
//		{
//			// coupled_model_info�� ������ �������� ���� �𵨵� �ε�
//			const Json::Value& child_models = cpd_model_info.get(PROTOCOL::COUPLED::CHILD_MODELS, Json::Value());
//			for (const auto& m : child_models) {
//				string model_name = m.get(PROTOCOL::COUPLED::MODEL_INFO::MODEL_NAME, "").asString();
//				model_t::MODEL_TYPE child_model_type = (model_t::MODEL_TYPE)m.get(PROTOCOL::COUPLED::MODEL_INFO::MODEL_TYPE, 0).asInt();
//				string ip = m.get(PROTOCOL::COUPLED::MODEL_INFO::IP_PORT, "localhost:8864").asString();
//				Json::Value init_param;
//				if (m.isMember(PROTOCOL::COUPLED::PORT::IN_PARAM)) {
//					init_param = m[PROTOCOL::COUPLED::PORT::IN_PARAM];
//					auto model = _modelsName.find(model_name);
//					if (model != _modelsName.end()) {
//						model->second->_init_param = init_param;
//					}
//				}
//
//				string model_name = m.get(PROTOCOL::COUPLED::MODEL_INFO::MODEL_NAME, "").asString();
//				if (child_model_type == model_t::MODEL_TYPE::COUPLED) {
//					update_modelparam(m);
//				}
//			}
//		}, coupled_model_info);
//	return 1;
//}

void sim_engine::process_events(vector<event_item>& queue)
{
    vector<event_item> pending;
    { std::lock_guard<std::mutex> lock(_mutex); pending.swap(queue); }
    for (auto& event : pending) {
        try { event.first(event.second); }
        catch (const std::exception& e) { spdlog::error("# rejected engine event::{}::{}", _project_name, e.what()); }
        catch (...) { spdlog::error("# rejected engine event::{}::unknown exception", _project_name); }
    }
}

void sim_engine::signal_ack()
{
    std::lock_guard<std::mutex> lock(_mutex);
    if (_recv_packet_buff.size() >= static_cast<size_t>(_ack_count.load())) SetEvent(_event_sync);
}

DWORD sim_engine::wait_for_ack()
{
    const auto deadline = std::chrono::steady_clock::now() + std::chrono::minutes(5);
    while (_engine_state != ENGINE_STATE_STOP_REQ) {
        const DWORD result = WaitForSingleObject(_event_sync, 100);
        if (result != WAIT_TIMEOUT) return result;
        if (std::chrono::steady_clock::now() >= deadline) return WAIT_TIMEOUT;
    }
    return WAIT_OBJECT_0;
}
