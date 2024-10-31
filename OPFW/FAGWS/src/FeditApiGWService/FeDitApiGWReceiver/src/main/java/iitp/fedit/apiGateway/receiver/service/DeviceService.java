package iitp.fedit.apiGateway.receiver.service;

import java.util.HashMap;
import java.util.List;

import iitp.fedit.apiGateway.common.dto.CtrlDeviceCmdExecReqResp;
import iitp.fedit.apiGateway.common.dto.CtrlDeviceInfo;

public interface DeviceService {
	

	public int createDevice(List<CtrlDeviceInfo> ctrlDeviceList) throws Exception;

	public List<CtrlDeviceInfo> getDeviceInfoList(HashMap<String, Object> map) throws Exception;

	public CtrlDeviceInfo getDeviceInfo(HashMap<String, Object> map) throws Exception;

	public int removeDevice(HashMap<String, Object> map) throws Exception;

	public int updateDevice(CtrlDeviceInfo ctrlDeviceInfo) throws Exception;

	
	
}
