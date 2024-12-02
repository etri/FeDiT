package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.component;

import java.util.HashMap;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service.TrackingEventTriggerService;
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
	private TrackingEventTriggerService trackingEventTriggerService;

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
	@RabbitListener(queues = "#{trgEventMsgTransmitQueue.getName()}")
	public void listenTrnCreateTopic(JSONObject json) {
		logger.info("tran Received message : {}", json.toString());

		HashMap<String, Object> map = new HashMap<>();
		HttpStatus resultSts = Constant.HTTP_OK_STAT;
		try {
			logger.debug("requestTrackingId : {} " + json.get("requestTrackingId"));

			if (json.get("requestTrackingId") != null && !"".equals(json.get("requestTrackingId"))) {
				map.put("requestTrackingId", json.get("requestTrackingId").toString());
			}
			if (json.get("trackingProcessId") != null && !"".equals(json.get("trackingProcessId"))) {
				map.put("trackingProcessId", json.get("trackingProcessId").toString());
			}
			if (json.get("detectorProcId") != null && !"".equals(json.get("detectorProcId"))) {
				map.put("detectorProcId", json.get("detectorProcId").toString());
			}
			if (json.get("eventOccuredId") != null && !"".equals(json.get("eventOccuredId"))) {
				map.put("eventOccuredId", json.get("eventOccuredId").toString());
			}
			trackingEventTriggerService.transsmiterProcess(map);

			resultSts = Constant.HTTP_OK_STAT;
			logger.info("resultSts : {}", resultSts);
		} catch (Exception e) {
			logger.error("Error Message : {} ", e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
			logger.info("resultSts : {}", resultSts);
		}

	}
}
