package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.component;

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

import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.CtrlCmdPrdService;
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
	public CtrlCmdPrdService ctrlCmdPrdService;


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
	@RabbitListener(queues = "#{pubControlCommandSendQueue.getName()}")
	public void pubContronlCommandSend(JSONObject json) {
		logger.info("Pub Received message : {} " , json.toString());

		if(json == null || json.get("requestControlCommandId") == null)
			return;

		HashMap<String, Object> map = new HashMap<>();
		try {
			logger.info("RabbitMQComponent requestControlCommandId : {}" , json.get("requestControlCommandId"));
			logger.info("RabbitMQComponent ctrlCmdSequenceId : {}" , json.get("ctrlCmdSequenceId"));

			String requestControlCommandId = json.get("requestControlCommandId").toString();
			String ctrlCmdSequenceId = json.get("ctrlCmdSequenceId").toString();

			if(!"".equals(requestControlCommandId) && requestControlCommandId != null) {
				map.put("requestControlCommandId", requestControlCommandId);
			}

			if(!"".equals(ctrlCmdSequenceId) && ctrlCmdSequenceId != null) {
				map.put("ctrlCmdSequenceId", ctrlCmdSequenceId);
			}

			ctrlCmdPrdService.executeTaskProc(map);


		} catch (Exception e) {
			logger.error("Error message : {}" , e);
		}

	}

}
