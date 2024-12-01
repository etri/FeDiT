package iitp.federatedTwins.msaOrchstr.rsDtConsumer.component;

import java.util.HashMap;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import iitp.federatedTwins.msaOrchstr.rsDtConsumer.service.impl.RsDtConsumerRMQServiceImpl;
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
	public RsDtConsumerRMQServiceImpl rsDtConsumerService;

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
	@RabbitListener(queues = "#{subRespResultListenQueue.getName()}")
	public void subRespResultListen(JSONObject json) {
		logger.info("Consumer Received message : {} ", json.toString());

		HashMap<String, Object> param = new HashMap<String, Object>();
	
		try {
			logger.info("reqCtrlCmdIdentifier : {} ", json.get("reqCtrlCmdIdentifier"));
			logger.info("================ Consumer received ResultData ==============>> " + json.get("controlResult"));

			if (json.get("reqCtrlCmdIdentifier") != null && json.get("controlResult") != null
					&& !"".equals(json.get("reqCtrlCmdIdentifier")) && !"".equals(json.get("controlResult"))) {
											
				param.put("federated_digital_object_control_data_id", json.get("reqCtrlCmdIdentifier"));
				param.put("control_execution_result", json.get("controlResult"));
								
				rsDtConsumerService.procReceiveResultData(param, this);
			} else {
				logger.info(" ************* receiveResultData param is empty Error ************* ");
			}
		} catch (Exception e) {
			logger.error("Error Message : {} ", e);
		}

	}

}
