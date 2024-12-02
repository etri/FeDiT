package iitp.fedit.apiGateway.responser.service;

import java.util.HashMap;

import org.json.simple.JSONObject;

import iitp.fedit.apiGateway.responser.component.RabbitMQComponent;

public interface ResponseResultService {
	
	public JSONObject procResponseResultMsg(HashMap<String, Object> map, RabbitMQComponent rabbitMqComponent) throws Exception;
	
	
}
