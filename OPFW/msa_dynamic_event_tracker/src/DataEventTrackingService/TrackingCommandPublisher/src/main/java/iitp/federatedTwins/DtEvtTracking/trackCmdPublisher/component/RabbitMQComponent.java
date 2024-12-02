package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.component;

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

import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.TrackingCmdPrdService;
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
	public TrackingCmdPrdService ctrlCmdPrdService;


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
	@RabbitListener(queues = "#{pubTrackingCommandSendQueue.getName()}")
	public void pubTrackingCommandSend(JSONObject json) {
		logger.info("Pub Received message : {} " , json.toString());
		
		HashMap<String, Object> map = new HashMap<>();
		try {

			logger.debug("requestTrackingId : {} " + json.get("requestTrackingId"));

			String requestTrackingId = (String) json.get("requestTrackingId");

			if (!"".equals(requestTrackingId) && requestTrackingId != null) {
				map.put("requestTrackingId", requestTrackingId);
				map.put("flag", "N");
				ctrlCmdPrdService.executeTrackingCommndProc(map);
			} else {
				logger.debug("**************  pubTrackingCommandSend ==> none requestTrackingId in the received data ***************** ");
			}
		} catch (Exception e) {
			logger.error("pubTrackingCommandSend Error Message : {} ", e);
		}

	}

	@RabbitListener(queues = "#{pubTrackingProcessSendQueue.getName()}")
	public void pubTrackingProcessSend(JSONObject json) {
		logger.info("Pub Received message : {} " , json.toString());

		HashMap<String, Object> map = new HashMap<>();
		try {

			logger.debug("requestTrackingId : {} " + json.get("requestTrackingId"));
			logger.debug("trackingProcessId : {} " + json.get("trackingProcessId"));

			String requestTrackingId = (String) json.get("requestTrackingId");
			String trackingProcessId = (String) json.get("trackingProcessId");

			if (!"".equals(requestTrackingId) && requestTrackingId != null) {
				map.put("requestTrackingId", requestTrackingId);
				map.put("flag", "N");
				
				if (!"".equals(trackingProcessId) && trackingProcessId != null) {
					map.put("trackingProcessId", trackingProcessId);
					
					ctrlCmdPrdService.executeTrackingProcessSingle(map);
				} else {
					logger.debug("**************  pubTrackingProcessSend ==> none trackingProcessId in the received data ***************** ");
				}
			} else {
				logger.debug("**************  pubTrackingProcessSend ==> none requestTrackingId in the received data ***************** ");
			}	
		} catch (Exception e) {
			logger.error("pubTrackingProcessSend Error Message : {} ", e);
		}

	}

	@RabbitListener(queues = "#{pubTopicDeleteQueue.getName()}")
	public void listenPubDelTopic(JSONObject json) throws Exception {

		try {
			logger.info("listenPubDelTopic >>>>>>>>>> : {}" , json.toJSONString());
			ctrlCmdPrdService.deleteProcess(json);

		} catch (Exception e) {
			logger.error("listenPubDelTopic Error Message : {}" , e);
		}
	}

}
