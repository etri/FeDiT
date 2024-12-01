package iitp.fedit.apiGateway.responser.component;

import java.util.HashMap;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import iitp.fedit.apiGateway.responser.service.ResponseResultService;
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

	@Autowired
	ResponseResultService responseService;

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

	/**
	 * Queue에서 메시지를 구독
	 *
	 * @param messageDto 구독한 메시지를 담고 있는 MessageDto 객체
	 * @throws Exception
	 */

	/**
	 * Queue에서 메시지를 구독
	 *
	 * @param messageDto 구독한 메시지를 담고 있는 MessageDto 객체
	 */
	@RabbitListener(queues = "#{queue.getName()}")
	public void pubContronlCommandSend(JSONObject json) {
		logger.info("Responsor RabbitMq Received message : {} " , json.toString());

		if (json == null || json.get("execCtrlCmdIdentifier") == null)
			return;

		HashMap<String, Object> map = new HashMap<>();
		try {
			logger.info("Responsor execCtrlCmdIdentifier : {}", json.get("execCtrlCmdIdentifier"));

			if (!"".equals(json.get("execCtrlCmdIdentifier")) && json.get("execCtrlCmdIdentifier") != null) {
				map.put("execCtrlCmdIdentifier", json.get("execCtrlCmdIdentifier").toString());
			}

			if (!"".equals(json.get("execResultCode")) && json.get("execResultCode") != null) {
				map.put("execResultCode", json.get("execResultCode").toString());
			}

			if (!"".equals(json.get("execResultValue")) && json.get("execResultValue") != null) {
				map.put("execResultValue", json.get("execResultValue").toString());
			}

			if (!"".equals(json.get("execResultMsg")) && json.get("execResultMsg") != null) {
				map.put("execResultMsg", json.get("execResultMsg").toString());
			}

			responseService.procResponseResultMsg(map, this);

		} catch (Exception e) {
			logger.error("Error message : {}", e);
		}

	}

	@PostConstruct
	public void init() {
	}

	@PreDestroy
	public void close() {
	}
}
