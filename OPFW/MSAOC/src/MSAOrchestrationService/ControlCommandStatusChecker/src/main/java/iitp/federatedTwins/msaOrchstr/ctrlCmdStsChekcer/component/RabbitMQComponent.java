package iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@Repository
@RequiredArgsConstructor

public class RabbitMQComponent {
	private final Logger logger = LoggerFactory.getLogger(RabbitMQComponent.class);

	@Value("${rabbitmq.exchange.name}")
	private String exchangeName;

	@Value("${rabbitmq.routing.key}")
	private String routingKey;

	@Autowired
	public RabbitTemplate rabbitTemplate;

	@Autowired
	ApplicationContext ctx;

	/**
	 * Queue로 메시지를 발행
	 *
	 * @param messageDto 발행할 메시지의 DTO 객체
	 */
	/**
	 * Queue로 메시지를 발행
	 *
	 * @param messageDto 발행할 메시지의 DTO 객체
	 */
	public void sendMessage(JSONObject json) {
		rabbitTemplate.convertAndSend(exchangeName, routingKey, json);
	}

	public void sendMessage(JSONObject json, String sendRoutingKey) {
		logger.info("sendMessage json : {}", json.toJSONString());
		logger.info("sendMessage routingKey : {}", routingKey);
		
		// 이벤트 전송
		rabbitTemplate.convertAndSend(exchangeName, sendRoutingKey, json);
	}



	@PostConstruct
	public void init() {
		System.out.println(">>>>>>>>>>  RabbitMQComponent 초기화 콜백  <<<<<<<<<<<<");
	}

	@PreDestroy
	public void close() {
		System.out.println(">>>>>>>>>>  RabbitMQComponent종료 전 콜백  <<<<<<<<<<<<");
	}
}
