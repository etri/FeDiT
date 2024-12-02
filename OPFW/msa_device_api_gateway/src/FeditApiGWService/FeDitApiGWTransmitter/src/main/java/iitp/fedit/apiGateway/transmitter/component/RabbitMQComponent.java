package iitp.fedit.apiGateway.transmitter.component;

import java.util.HashMap;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import iitp.fedit.apiGateway.transmitter.service.TransMitterMsgService;
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
	TransMitterMsgService transService;

	/**
	 * Queue로 메시지를 발행
	 *
	 * @param messageDto 발행할 메시지의 DTO 객체
	 */
	public void sendMessage(JSONObject json) {
		rabbitTemplate.convertAndSend(exchangeName, routingKey, json);
	}

	public void sendMessage(JSONObject json, String sendRoutingKey) {
		rabbitTemplate.convertAndSend(exchangeName, sendRoutingKey, json);
	}

	/**
	 * Queue에서 메시지를 구독
	 *
	 * @param messageDto 구독한 메시지를 담고 있는 MessageDto 객체
	 */
	@RabbitListener(queues = "#{queue.getName()}")
	public void listenTrnCreate(JSONObject json) {
		logger.info("TransMitter RabbitMq Received message : {} ", json.toString());

		HashMap<String, Object> map = new HashMap<>();
		try {
//			logger.info("TransMitter sendProcessType : {}" , json.get("sendProcessType"));
			logger.info("TransMitter dgtwReqCtrlCmdId : {}", json.get("dgtwReqCtrlCmdId"));
			logger.info("TransMitter dgtwExecCtrlCmdId : {}", json.get("dgtwExecCtrlCmdId"));
			logger.info("TransMitter execResultCode : {}", json.get("execResultCode"));
			logger.info("TransMitter execResultValue : {}", json.get("execResultValue"));
			logger.info("TransMitter execResultMsg : {}", json.get("execResultMsg"));

			if (!"".equals(json.get("dgtwReqCtrlCmdId")) && json.get("dgtwReqCtrlCmdId") != null) {
				map.put("dgtwReqCtrlCmdId", json.get("dgtwReqCtrlCmdId").toString());
			}

			if (!"".equals(json.get("dgtwExecCtrlCmdId")) && json.get("dgtwExecCtrlCmdId") != null) {
				map.put("dgtwExecCtrlCmdId", json.get("dgtwExecCtrlCmdId").toString());
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

			transService.procTransMitterMsg(map);

		} catch (Exception e) {
			logger.error("Error message : {}", e);
		}
	}
}
