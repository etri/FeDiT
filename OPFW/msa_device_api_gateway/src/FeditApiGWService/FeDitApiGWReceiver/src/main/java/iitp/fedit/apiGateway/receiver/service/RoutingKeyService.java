package iitp.fedit.apiGateway.receiver.service;

import java.util.HashMap;
import java.util.List;

import iitp.fedit.apiGateway.common.dto.CtrlDeviceCmdExecReqResp;

public interface RoutingKeyService {
	


	public int insertRoutingKey(List<CtrlDeviceCmdExecReqResp> ctrlDeviceCmdExecReqResp) throws Exception;

	public int updateRoutingKey(List<CtrlDeviceCmdExecReqResp> ctrlDeviceCmdExecReqRespList) throws Exception;

	public int deleteRoutingKey(HashMap<String, Object> map) throws Exception;

	public List<CtrlDeviceCmdExecReqResp> getRoutingKeyList(HashMap<String, Object> map) throws Exception;
	
	
}
