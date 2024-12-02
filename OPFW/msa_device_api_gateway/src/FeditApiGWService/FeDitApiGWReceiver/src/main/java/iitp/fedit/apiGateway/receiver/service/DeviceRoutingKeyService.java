package iitp.fedit.apiGateway.receiver.service;

import java.util.HashMap;
import java.util.List;

import iitp.fedit.apiGateway.common.dto.CtrlDeviceCmdExecReqResp;
import iitp.fedit.apiGateway.common.dto.CtrlDeviceRoutingServiceInfo;

public interface DeviceRoutingKeyService {
	


	public int insertDeviceRoutingKey(List<CtrlDeviceRoutingServiceInfo> ctrlDeviceRoutingServiceInfo) throws Exception;

	public int updateDeviceRoutingKey(List<CtrlDeviceRoutingServiceInfo> ctrlDeviceRoutingServiceList) throws Exception;

	public int deleteDeviceRoutingKey(HashMap<String, Object> map) throws Exception;

	public List<CtrlDeviceRoutingServiceInfo> getDeviceRoutingKeyList(HashMap<String, Object> map) throws Exception;
	
	
}
