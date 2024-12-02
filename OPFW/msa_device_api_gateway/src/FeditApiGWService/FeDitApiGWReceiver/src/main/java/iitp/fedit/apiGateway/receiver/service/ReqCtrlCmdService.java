package iitp.fedit.apiGateway.receiver.service;

import org.springframework.http.HttpStatus;

import iitp.fedit.apiGateway.common.dto.DigitalTwinRequestCtrlCmdInfo;

public interface ReqCtrlCmdService {
	
	public HttpStatus procRequestControlCommand(DigitalTwinRequestCtrlCmdInfo digitalTwinRequestCtrlCmdInfo) throws Exception;
	
	
}
