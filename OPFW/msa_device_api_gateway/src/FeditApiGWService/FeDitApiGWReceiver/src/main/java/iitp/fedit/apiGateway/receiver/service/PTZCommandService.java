package iitp.fedit.apiGateway.receiver.service;

import java.util.HashMap;
import java.util.List;

import iitp.fedit.apiGateway.common.dto.CtrlDeviceCmdExecReqResp;
import iitp.fedit.apiGateway.common.dto.DigitalTwinRequestCtrlCmdInfo;

public interface PTZCommandService {

	List<HashMap<String, Object>> getReqCtrlCmdList(HashMap<String, Object> map) throws Exception;

	int deleteReqCtrlCmd(HashMap<String, Object> map) throws Exception;
	

	
}
