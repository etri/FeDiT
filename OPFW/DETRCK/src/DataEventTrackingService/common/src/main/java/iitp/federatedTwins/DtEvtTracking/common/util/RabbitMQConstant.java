package iitp.federatedTwins.DtEvtTracking.common.util;

public class RabbitMQConstant {
	
	//Receiver
	//모듈에서 사용될 Queue Name 
	public final static String RABBITMQ_QUEUE_REC_TRACKING_COMMAND_CREATE = "receiver.tracking.command.create";
	
	// 모듈에서 사용될 Routing Key
	public final static String RABBITMQ_ROUTING_KEY_REC_TRACKING_COMMAND_CREATE = "iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.command.create";
	
	
	//Publisher
	//모듈에서 사용될 Queue Name 
	public final static String RABBITMQ_QUEUE_PUB_TRACKING_COMMAND_SEND = "publisher.tracking.command.send";
	public final static String RABBITMQ_QUEUE_PUB_TRACKING_PROCESS_SEND = "publisher.tracking.process.send";
	
	public final static String RABBITMQ_QUEUE_PUB_TOPIC_DELETE = "publisher.tracking.topic.delete";
	
	// 모듈에서 사용될 Routing Key
	public final static String RABBITMQ_ROUTING_KEY_PUB_TRACKING_COMMAND_SEND = "iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.tracking.command.send";
	public final static String RABBITMQ_ROUTING_KEY_PUB_TRACKING_PROCESS_SEND = "iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.tracking.process.send";
	public final static String RABBITMQ_ROUTING_KEY_PUB_TOPIC_DELETE = "iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.command.topic.delete";
	
	
	//Subscriber
	//모듈에서 사용될 Queue Name 
	public final static String RABBITMQ_QUEUE_SUB_KAFKA_LSTN_CREATE = "trackDataSub.kafka.listener.create";
	public final static String RABBITMQ_QUEUE_SUB_KAFKA_LSTN_DELETE = "trackDataSub.kafka.listener.delete";

	// 모듈에서 사용될 Routing Key
	public final static String RABBITMQ_ROUTING_KEY_SUB_KAFKA_LSTN_CREATE = "iitp.federatedTwins.DtEvtTracking.trackDataSub.kafka.listener.create";
	public final static String RABBITMQ_ROUTING_KEY_SUB_KAFKA_LSTN_DELETE = "iitp.federatedTwins.DtEvtTracking.trackDataSub.kafka.listener.del";

	//Trigger
	//모듈에서 사용될 Queue Name 
	public final static String RABBITMQ_QUEUE_TGR_EVENT_MESSAGE_TRANSMIT = "dtEvtTracking.event.trigger.message.transmit";

	// 모듈에서 사용될 Routing Key
	public final static String RABBITMQ_ROUTING_KEY_TGR_EVENT_TRANSMIT = "iitp.federatedTwins.DtEvtTracking.trackEntTrigger.event.message.transmit";
	
}
