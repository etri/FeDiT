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
	/**
	 * Queue로 메시지를 발행
	 *
	 * @param messageDto 발행할 메시지의 DTO 객체
	 */
	public void sendMessage(JSONObject json) throws Exception {
		rabbitTemplate.convertAndSend(exchangeName, routingKey, json);
	}

	public void sendMessage(JSONObject json, String sendRoutingKey) throws Exception {
		rabbitTemplate.convertAndSend(exchangeName, sendRoutingKey, json);		
	}

	/**
	 * Queue에서 메시지를 구독
	 *
	 * @param messageDto 구독한 메시지를 담고 있는 MessageDto 객체
	 * @throws Exception 
	 */
	@RabbitListener(queues = "#{trackingCommandCreateQueue.getName()}")		
	public void trackingCommandCreate(JSONObject jsonObject, @Headers Map<String, Object> headers) throws Exception {
		System.out.println("Received message: "+jsonObject.toString());	  
		System.out.println("Received headers: "+headers.toString());

	}
}
