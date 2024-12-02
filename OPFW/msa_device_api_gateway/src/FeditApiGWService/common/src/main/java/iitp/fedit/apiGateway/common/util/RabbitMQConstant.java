package iitp.fedit.apiGateway.common.util;

public class RabbitMQConstant {
		
	//Processor
	//모듈에서 사용될 Queue Name 
	public final static String APIGATEWAY_PROCESSOR_QUEUE = "iitp.fedit.apiGateway.processor";		
	// 모듈에서 사용될 Routing Key
	public final static String APIGATEWAY_PROCESSOR_ROUTING_KEY_REQUEST_COMMAND = "iitp.fedit.apiGateway.processor.request.command";	
	
	//RESPONSER
	//모듈에서 사용될 Queue Name 
	public final static String APIGATEWAY_RESPONSER_QUEUE = "iitp.fedit.apiGateway.responser";
	// 모듈에서 사용될 Routing Key
	public final static String APIGATEWAY_RESPONSER_ROUTING_KEY = "iitp.fedit.apiGateway.responser.resultMsg";

	//TRANSMITTER
	//모듈에서 사용될 Queue Name 
	public final static String APIGATEWAY_RESULT_TRANSMITTER_QUEUE = "iitp.fedit.apiGateway.transmitter";
	// 모듈에서 사용될 Routing Key
	public final static String APIGATEWAY_RESULT_TRANSMITTER_ROUTING_KEY = "iitp.fedit.apiGateway.transmitter.transData";
	
}
