package iitp.fedit.apiGateway.ctrlCmdProc.component;

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

import iitp.fedit.apiGateway.ctrlCmdProc.service.CtrlCmdExecService;
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
	public CtrlCmdExecService ctrlCmdExecService;

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
	public void pubContronlCommandSend(JSONObject json) {
		logger.info("Processor RabbitMq Received message : {}", json.toString());

		if (json == null || json.get("dgtwReqCtrlCmdId") == null)
			return;

		HashMap<String, Object> map = new HashMap<>();
		try {
			logger.info("Processor dgtwReqCtrlCmdId : {}", json.get("dgtwReqCtrlCmdId"));
			logger.info("Processor dgtwExecCtrlCmdId : {}", json.get("dgtwExecCtrlCmdId"));

			if (!"".equals(json.get("dgtwReqCtrlCmdId")) && json.get("dgtwReqCtrlCmdId") != null) {
				map.put("dgtwReqCtrlCmdId", json.get("dgtwReqCtrlCmdId").toString());
			}

			if (!"".equals(json.get("dgtwExecCtrlCmdId")) && json.get("dgtwExecCtrlCmdId") != null) {
				map.put("dgtwExecCtrlCmdId", json.get("dgtwExecCtrlCmdId").toString());
			}

			ctrlCmdExecService.executeTaskProc(map, this);

		} catch (Exception e) {
			logger.error("Error message : {}", e);
		}

	}

}
