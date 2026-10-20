#include "atomic_imp.h"
#include "../common/common.h"
#include "sim_manager.h"

atomic_imp::atomic_imp()
{
	_model_type = model_t::MODEL_TYPE::ATOMIC;
	_iscapsule_connected = false;
	_websocket_client = 0; // was left uninitialized before; connect_model_capsule() and
							// the destructor both read this pointer before load() may
							// ever have run (e.g. release() on a model that never loaded)
}

atomic_imp::atomic_imp(MODEL_TYPE type)
{
	_model_type = type;
	_iscapsule_connected = false;
	_websocket_client = 0;
}

atomic_imp::~atomic_imp()
{
	if (_websocket_client != 0) {
		delete _websocket_client;
	}
	_websocket_client = 0;
}

void atomic_imp::push_send_buff(string type, Json::Value msg)
{
	std::lock_guard<std::mutex> lock(_send_mutex);

	if (_iscapsule_connected) {
		_websocket_client->send_json(type.c_str(), msg, 1, false);
	}
	else {
		_send_buff.push_back({ type, msg });
	}

}

bool atomic_imp::load(const string& ip_and_port, Json::Value msg)
{
	push_send_buff(PROTOCOL::ATOMIC::TYPE, msg);
	connect_model_capsule(ip_and_port);
	return true;
}

bool atomic_imp::is_loaded()
{
	if(this->_conn_hdl.use_count() == 0)
		return false;
	return true;
}

int atomic_imp::call_init(const string& project_name, Json::Value msg)
{
	if (!_init_param.isNull()) {
		std::cout << Json::stringifyJson(_init_param) << endl;

		spdlog::info("{}{}SendParam : {}{}", this->_model_name, spdlog::ctl::green, Json::stringifyJson(_init_param), spdlog::ctl::reset);
		MODEL_SOCKET.send_json(project_name, this->_conn_hdl, PROTOCOL::PORT::IN_PARAM.c_str(), _init_param, 1);
	}
	return MODEL_SOCKET.send_json(project_name, this->_conn_hdl, PROTOCOL::MODEL_INIT::TYPE.c_str(), msg, 1, true);
}

int atomic_imp::call_int_trans_fn(const string& project_name, Json::Value msg)
{
	return MODEL_SOCKET.send_json(project_name, this->_conn_hdl, PROTOCOL::TIME_ADVANCE::TYPE.c_str(), msg, 1, true);
}

int atomic_imp::call_ext_trans_fn(const string& project_name, Json::Value msg)
{
	return MODEL_SOCKET.send_json(project_name, this->_conn_hdl, PROTOCOL::EXT_TRANS::TYPE.c_str(), msg, 1, true);
}

int atomic_imp::release()
{
	// Ask atomic_model_manager to make sure the underlying model_cap_*.exe OS process
	// is actually terminated, instead of relying solely on it noticing the MODEL_SOCKET
	// connection close below and exiting itself (model_cap.cpp is written to exit once
	// its connection to fDTSimServer drops -- see its on_disconnect_callback -- but if
	// this model instance never finished connecting back before release() ran, e.g. it
	// was unloaded moments after being launched, MODEL_SOCKET never captured a handle
	// for it and close_client() below is a no-op; the spawned process would otherwise
	// be orphaned and pile up with every load/unload cycle). This goes out over the
	// persistent connection this atomic_imp already holds to atomic_model_manager
	// (opened in connect_model_capsule() when the model was launched); atomic_model_manager
	// tracks the OS process id independently and can forcefully terminate it.
	Json::Value kill_msg;
	kill_msg[PROTOCOL::ATOMIC::CMD] = PROTOCOL::ATOMIC::KILL;
	kill_msg[PROTOCOL::ATOMIC::MODEL_INFO::PROJECT_NAME] = _eng_ptr ? _eng_ptr->get_project_name() : "";
	kill_msg[PROTOCOL::ATOMIC::MODEL_INFO::MODEL_NAME] = _model_name;
	kill_msg[PROTOCOL::ATOMIC::MODEL_INFO::IID] = _iid;
	// Temporary diagnostic (info level so it is visible in Release builds too --
	// DPRINT_INIT sets the log level to info there, so spdlog::debug never shows):
	// confirms release() actually ran and whether the atomic_model_manager link was
	// up at the moment the KILL was queued.
	spdlog::info("# atomic_imp::release::sending KILL::project={}::model={}::iscapsule_connected={}",
		_eng_ptr ? _eng_ptr->get_project_name() : "", _model_name, _iscapsule_connected.load());
	push_send_buff(PROTOCOL::ATOMIC::TYPE, kill_msg);

	MODEL_SOCKET.close_client(this->_conn_hdl);
	return 1;
}

int atomic_imp::connect_model_capsule(const string& ip_and_port)
{
	if (_websocket_client != 0) {
		delete _websocket_client;
	}
	_websocket_client = new websocket_client;
	_websocket_client->on_connect_callback = [this]() {
		std::lock_guard<std::mutex> lock(_send_mutex);
		spdlog::debug("# websocket_client::on_connect");
		this->_iscapsule_connected = true;
		if (_send_buff.size() > 0) {
			for (const auto& msg : _send_buff) {
				_websocket_client->send_json(msg.first.c_str(), msg.second, 1, false);
			}
			_send_buff.clear();
		}
	};
	_websocket_client->on_disconnect_callback = [this]() {
		spdlog::debug("# websocket_client::on_disconnect");
		this->_iscapsule_connected = false;
	};
	_websocket_client->on_message_callback(PROTOCOL::ATOMIC::ACK::TYPE, [](const Json::Value& msg) {
		spdlog::debug("# websocket_client::on_message_ack");
		});
	_websocket_client->on_message_callback(PROTOCOL::ATOMIC::NAK::TYPE, [this](const Json::Value& msg) {
		spdlog::warn("# model launch rejected: {}", Json::stringifyJson(msg));
		if (_eng_ptr) _eng_ptr->load_signal->cancel();
		});

	_websocket_client->connect("ws://" + ip_and_port);
	return 0;
}
