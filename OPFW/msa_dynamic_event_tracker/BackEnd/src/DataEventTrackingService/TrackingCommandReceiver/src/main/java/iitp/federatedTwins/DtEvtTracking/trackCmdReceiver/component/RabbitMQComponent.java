package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.component;

import java.util.Map;

import org.json.simple.JSONObject;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.handler.annotation.Headers;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@Repository
@RequiredArgsConstructor
public class RabbitMQComponent {
	@Value("${rabbitmq.exchange.name}")
	private String exchangeName;

	@Value("${rabbitmq.routing.key}")
	private String routingKey;

	@Autowired
	public RabbitTemplate rabbitTemplate;

	public void sendMessage(JSONObject json) throws Exception {
		rabbitTemplate.convertAndSend(exchangeName, routingKey, json);
	}

	public void sendMessage(JSONObject json, String sendRoutingKey) throws Exception {
		rabbitTemplate.convertAndSend(exchangeName, sendRoutingKey, json);		
	}

	@RabbitListener(queues = "#{trackingCommandCreateQueue.getName()}")		
	public void trackingCommandCreate(JSONObject jsonObject, @Headers Map<String, Object> headers) throws Exception {
		System.out.println("Received message: "+jsonObject.toString());	  
		System.out.println("Received headers: "+headers.toString());
	}
}
