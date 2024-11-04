package iitp.federatedTwins.msaOrchstr.common.util;

public class RabbitMQConstant {
	
	//Receiver
	//모듈에서 사용될 Queue Name 
	public final static String RABBITMQ_QUEUE_REC_REQ_CTRL_COMMAND_CREATE = "receiver.reqCtrlCommand.create";
	
	// 모듈에서 사용될 Routing Key
	public final static String RABBITMQ_ROUTING_KEY_REC_REQ_CTRL_COMMAND_CREATE = "iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.command.create";
	
	
	//Publisher
	//모듈에서 사용될 Queue Name 
	public final static String RABBITMQ_QUEUE_PUB_REQ_CTRL_COMMAND_SEND = "publisher.reqCtrlCommand.send";
	
	public final static String RABBITMQ_QUEUE_PUB_TOPIC_DELETE = "publisher.reqCtrlCommand.topic.delete";
	
	// 모듈에서 사용될 Routing Key
	public final static String RABBITMQ_ROUTING_KEY_PUB_REQ_CTRL_COMMAND_SEND = "iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.reqCtrlCommand.send";
	public final static String RABBITMQ_ROUTING_KEY_PUB_TOPIC_DELETE = "iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.command.topic.delete";
	
	
	//Subscriber
	//모듈에서 사용될 Queue Name 
	public final static String RABBITMQ_QUEUE_SUB_RESP_RSSULT_LISTEN = "consumer.response.result.listen";

	// 모듈에서 사용될 Routing Key
	public final static String RABBITMQ_ROUTING_KEY_SUB_RESP_RSSULT_LISTEN = "iitp.federatedTwins.msaOrchstr.rsDtConsumer.response.result.listen";

	//Trigger
	//모듈에서 사용될 Queue Name 
	public final static String RABBITMQ_QUEUE_TGR_EVENT_MESSAGE_TRANSMIT = "transmitter.result.message.send";

	// 모듈에서 사용될 Routing Key
	public final static String RABBITMQ_ROUTING_KEY_TGR_EVENT_TRANSMIT = "iitp.federatedTwins.msaOrchstr.rsDtTransmitter.event.message.transmit";
	
}
