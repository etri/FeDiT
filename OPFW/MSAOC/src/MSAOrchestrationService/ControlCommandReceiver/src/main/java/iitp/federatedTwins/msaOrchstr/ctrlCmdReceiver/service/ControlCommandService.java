package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.service;

import java.util.HashMap;

import org.springframework.http.HttpStatus;

import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.ControlCommandVO;

public interface ControlCommandService {
	
	public HttpStatus procRequestRegisteFdtObjData(ControlCommandVO controlCommand) throws Exception;
	
	public HttpStatus procRequestControlCommand(ControlCommandVO controlCommand) throws Exception;
	
	public HashMap<String, Object> insertRequestRegisteFdtObjData(ControlCommandVO controlCommand) throws Exception;

	public HashMap<String, Object> insertRequestControlCommand(ControlCommandVO controlCommand) throws Exception;
	
}
