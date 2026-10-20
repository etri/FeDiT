#include "embeded_func_imp.h"
#include "sim_manager.h"
#include "../common/common.h"
#include "sim_engine.h"

embeded_func_imp::embeded_func_imp()
{
	_model_type = MODEL_TYPE::EMBEDED_FUNC;
}

int embeded_func_imp::call_init(const string& project_name, Json::Value msg)
{
	msg[PROTOCOL::ATOMIC::MODEL_INFO::PROJECT_NAME] = this->_eng_ptr->get_project_name();
	msg[PROTOCOL::ATOMIC::MODEL_INFO::IID] = this->_iid;
	GUI_SOCKET.send_json(project_name, this->_eng_ptr->get_gui_handle(), PROTOCOL::MODEL_INIT::TYPE.c_str(), msg, 1);
	return 0;//�������� ����(ack)�� ��ٸ��� �ʵ��� 0(zero)�� ����
}

bool embeded_func_imp::load(const string& ip_and_port, Json::Value msg)
{
	GUI_SOCKET.send_json(this->_eng_ptr->get_gui_handle(), PROTOCOL::MODEL_INIT::TYPE.c_str(), msg, 1);
	return false;
}

int embeded_func_imp::call_ext_trans_fn(const string& project_name, Json::Value msg)
{
	spdlog::debug("# embeded_func_imp::call_ext_trans_fn::");
	// 병렬실행 시 run_id를 메시지에 포함해 프론트가 결과창을 구분할 수 있게 함
	msg[PROTOCOL::SIM_CTL::RUN_ID] = this->_eng_ptr->_run_id;
	GUI_SOCKET.send_json(this->_eng_ptr->get_gui_handle(), PROTOCOL::GUI::RES_M::TYPE.c_str(), msg, 1);
	return 0;//�������� ����(ack)�� ��ٸ��� �ʵ��� 0(zero)�� ����
}
