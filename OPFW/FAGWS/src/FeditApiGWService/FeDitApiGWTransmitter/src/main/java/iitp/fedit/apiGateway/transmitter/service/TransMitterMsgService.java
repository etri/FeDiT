package iitp.fedit.apiGateway.transmitter.service;

import java.util.HashMap;

import org.json.simple.JSONObject;

public interface TransMitterMsgService {

	public JSONObject procTransMitterMsg(HashMap<String, Object> map) throws Exception;

	public void getReqCtrlCmdListAndDeleteCmd(HashMap<String, Object> map) throws Exception;

}
