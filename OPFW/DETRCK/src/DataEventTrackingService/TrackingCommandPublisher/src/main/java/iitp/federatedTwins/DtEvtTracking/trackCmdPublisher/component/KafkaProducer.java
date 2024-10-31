package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.component;

import java.util.HashMap;

import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.kafka.core.KafkaProducerException;
import org.springframework.kafka.core.KafkaSendCallback;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;
import org.springframework.util.concurrent.ListenableFuture;

import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.common.util.RabbitMQConstant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.TrackingCmdPrdService;

@Component
public class KafkaProducer {

	private final Logger log = LoggerFactory.getLogger(this.getClass());

	@Autowired(required = false)
	@Qualifier("poolHttpClientConnManager")
	private PoolingHttpClientConnectionManager connManager;

	@Autowired
	ApplicationContext ctx;

	@Autowired
	TrackingCmdPrdService trackingCmdPrdService;

	@Autowired
	TrackingProcessInfoMapper trackingProcessInfoMapper;

	@Autowired
	private KafkaTemplate<String, Object> kafkaTemplate;

	@Autowired
	public RabbitMQComponent rabbitMQComponent;

	public void sendTopic(HashMap<String, Object> map) throws Exception {

		ListenableFuture<SendResult<String, Object>> future = kafkaTemplate.send((String) map.get("topic"),
				map.get("payload"));

		future.addCallback(new KafkaSendCallback<>() {

			@Override
			public void onSuccess(SendResult<String, Object> result) {

				try {
					log.info("Success to send message.");
					log.info("Sent message=[" + map.get("payload") + "] with offset=["
							+ result.getRecordMetadata().offset() + "]");

					trackingCmdPrdService.updateProcessAndInsertTopic(map);
					sendRabbitMqMsg(map);
				} catch (Exception e) {
					e.printStackTrace();
				}
			}

			@Override
			public void onFailure(KafkaProducerException ex) {
				// TODO Auto-generated method stub
				ProducerRecord<Object, Object> failedProducerRecord = ex.getFailedProducerRecord();
				log.error("Fail to send message.", failedProducerRecord);

				// 실패처리
				log.info("**************************Send Fail**************************");
				throw new RuntimeException(ex);

			}
		});
	}

	public void sendRabbitMqMsg(HashMap<String, Object> map) throws Exception {

		HashMap<String, Object> pMap = new HashMap<>();
		try {

			log.info("Success to send message.");
			log.info("Sent message=[" + map.get("payload") + "]");

			JSONObject json = new JSONObject();
			String routingKey;

			if (map.get("mode") != null && map.get("mode").equals("C")) {

				if(Constant.TRCK_CMD_TYPE_DATA.equals(map.get("trckTp"))) {
					trackingCmdPrdService.insertTopic(map);					
				}

				json.put("mode", map.get("mode"));
				json.put("trckTp", map.get("trckTp"));
				json.put("group", "tracking");
				json.put("topic", map.get("topic"));
				json.put("payload", map.get("payload"));
				json.put("requestTrackingId", map.get("requestTrackingId"));
				json.put("trackingProcessId", map.get("trackingProcessId"));
				routingKey = RabbitMQConstant.RABBITMQ_ROUTING_KEY_SUB_KAFKA_LSTN_CREATE;

				// 트래킹 프로세스 상태정보 변경 : 생성/등록-> 준비 상태
				pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_WAIT);
				pMap.put("trackingProcessId", map.get("trackingProcessId"));
				pMap.put("statusResultMsg", "Tracking Process STATUS WAIT Update Success");

			} else {

				json.put("mode", map.get("mode"));
				json.put("group", "tracking");
				json.put("topic", map.get("topic"));
				json.put("requestTrackingId", map.get("requestTrackingId"));
				json.put("trackingProcessId", map.get("trackingProcessId"));

				map.put("topicName", map.get("topic"));
				map.put("groupName", "tracking");

				routingKey = RabbitMQConstant.RABBITMQ_ROUTING_KEY_SUB_KAFKA_LSTN_DELETE;

				// 최종 상태를 완료 상태로 변경처리 => 에러, 오류, 강제종료 상태 => 완료상태로 변경, 이력은 오류상태 후 정상처리 두가지의 로그가 남음. 
				pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_COMPLETE);
				pMap.put("reqTrckCmdStatus", Constant.TRCK_CMD_STATUS_COMPLETE);
				pMap.put("trackingProcessId", map.get("trackingProcessId"));
				pMap.put("requestTrackingId", map.get("requestTrackingId"));
				pMap.put("statusResultMsg", "Tracking Process STATUS COMPLETE Update Success ==> KAFKA LSTN DELETE ");

			}

			rabbitMQComponent.sendMessage(json, routingKey);

		} catch (Exception e) {
//			e.printStackTrace();
			log.error("sendRabbitMqMsg Error Message : {}", e);
			pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_ERROR);
			pMap.put("reqTrckCmdStatus", Constant.TRCK_CMD_STATUS_ERROR);
			pMap.put("trackingProcessId", map.get("trackingProcessId"));
			pMap.put("requestTrackingId", map.get("requestTrackingId"));
			pMap.put("statusResultMsg", "Tracking Process STATUS ERROR Update Success");
		} finally {
			try {
				trackingCmdPrdService.updateWithHisAndTrackingProcInfo(pMap);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

	}

}