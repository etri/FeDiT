package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service;

import java.util.HashMap;

import org.springframework.http.HttpStatus;

public interface CtrlCmdPrdService {

	public HttpStatus executeTaskProc(HashMap<String, Object> map) throws Exception;

	public HashMap<String, Object> insertTaskProc(HashMap<String, Object> map) throws Exception;
}
