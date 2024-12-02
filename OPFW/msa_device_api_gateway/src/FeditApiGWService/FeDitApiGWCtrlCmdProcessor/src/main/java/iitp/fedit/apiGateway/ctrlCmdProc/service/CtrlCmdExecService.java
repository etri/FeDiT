package iitp.fedit.apiGateway.ctrlCmdProc.service;

import java.util.HashMap;

import iitp.fedit.apiGateway.ctrlCmdProc.component.RabbitMQComponent;

public interface CtrlCmdExecService {

	public void executeTaskProc(HashMap<String, Object> map, RabbitMQComponent rabbitMqComponent) throws Exception;

}
