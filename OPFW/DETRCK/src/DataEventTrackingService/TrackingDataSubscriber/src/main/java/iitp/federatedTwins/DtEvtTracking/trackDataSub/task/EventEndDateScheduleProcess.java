package iitp.federatedTwins.DtEvtTracking.trackDataSub.task;

import java.util.HashMap;
import java.util.concurrent.ScheduledFuture;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.common.util.RabbitMQConstant;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.component.KafkaConsumer;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.component.KafkaListenerAutomation;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.component.RabbitMQComponent;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.TrackingDataSubscriberService;

@Component
@Scope(value = "prototype")
public class EventEndDateScheduleProcess implements Runnable {

	private final Logger logger = LoggerFactory.getLogger(EventEndDateScheduleProcess.class);

	@Autowired
	public TrackingProcessInfoMapper trackingProcessInfoMapper;

	@Autowired
	public TrackingDataSubscriberService trackingDataSubService;

	@Autowired
	HashMap<String, ScheduledFuture> eventScheduledFutureInfo;

	@Autowired
	HashMap<String, ScheduledFuture> eventEndDateScheduledFutureInfo;

	@Autowired
	KafkaListenerAutomation kafkaListenerAutomation;

	@Autowired
	HashMap<String, KafkaConsumer> kafkaConsumerinfo;

	@Autowired
	public RabbitMQComponent rabbitMQComponent;

	public String resId;
	public String proId;

	public EventEndDateScheduleProcess(String resId, String proId) {
		this.resId = resId;
		this.proId = proId;
	}

	@Override
	public void run() {
		logger.info("EventEndDateScheduleProcess - Start run() ==> " + resId + " : " + proId);
		HashMap<String, Object> pMap = new HashMap<>();
		TrackingProcessInfo trackingProcessInfo = null;

		try {

			HashMap<String, Object> param = new HashMap<>();
			param.put("requestTrackingId", resId);
			param.put("trackingProcessId", proId);
			param.put("trackingStatus", Constant.TRCK_PROC_STATUS_RUNNING);

			trackingProcessInfo = trackingProcessInfoMapper.getTrackingProcessInfo(param);

			// 데이터 트래킹 스케줄이 있으면 삭제
			ScheduledFuture schFuture = eventScheduledFutureInfo.get(resId + proId);

			if (schFuture != null) {
				schFuture.cancel(true);
				schFuture = null;
				eventScheduledFutureInfo.remove(resId + proId);
			}

			// 데이터 트래킹 스케줄이 있으면 삭제
			ScheduledFuture endDtFuture = eventEndDateScheduledFutureInfo.get(resId + proId);

			if (endDtFuture != null) {
				endDtFuture.cancel(true);
				endDtFuture = null;
				eventEndDateScheduledFutureInfo.remove(resId + proId);
			}

			// 카프카 컨슈머 삭제
			if (trackingProcessInfo != null) {
				JSONObject json = new JSONObject();

				logger.info("topic : {}", trackingProcessInfo.getTrackingKafkaTopic() != null ? trackingProcessInfo.getTrackingKafkaTopic() : trackingProcessInfo.getFederatedTwinId());
				logger.info("requestTrackingId : {}", trackingProcessInfo.getRequestTrackingId());
				logger.info("trackingProcessId : {}", trackingProcessInfo.getTrackingProcessId());

				json.put("topic", trackingProcessInfo.getTrackingKafkaTopic() != null ? trackingProcessInfo.getTrackingKafkaTopic() : trackingProcessInfo.getFederatedTwinId());
				json.put("requestTrackingId", trackingProcessInfo.getRequestTrackingId());
				json.put("trackingProcessId", trackingProcessInfo.getTrackingProcessId());

				rabbitMQComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TOPIC_DELETE);

			}

			if (trackingProcessInfo != null) {
				// 완료나 에러상태가 아니라면 완료상태로 업데이트
				if (!Constant.TRCK_PROC_STATUS_COMPLETE.equals(trackingProcessInfo.getTrackingStatus()) && !Constant.TRCK_PROC_STATUS_ERROR.equals(trackingProcessInfo.getTrackingStatus())) {
					// 상태정보 업데이트 확인 및 변경
					// 트래킹 프로세스 상태정보 변경 : 스케줄에 의한 완료 상태로 변경처리
					pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_COMPLETE);
					pMap.put("reqTrckCmdStatus", Constant.TRCK_CMD_STATUS_COMPLETE);
					pMap.put("trackingProcessId", proId);
					pMap.put("requestTrackingId", resId);
					pMap.put("statusResultMsg", "Event End Date Schedule Process STATUS COMPLETE Update Success");
				}
			}

		} catch (Exception e) {
			logger.error("Error Message : {}", e);
			pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_ERROR);
			pMap.put("reqTrckCmdStatus", Constant.TRCK_CMD_STATUS_ERROR);
			pMap.put("trackingProcessId", proId);
			pMap.put("requestTrackingId", resId);
			pMap.put("statusResultMsg", "Event End Date Schedule Process STATUS ERROR Update Success");
		} finally {
			try {
				if (trackingProcessInfo != null) {
					trackingDataSubService.updateWithHisAndTrackingProcInfo(pMap);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

	}
}
