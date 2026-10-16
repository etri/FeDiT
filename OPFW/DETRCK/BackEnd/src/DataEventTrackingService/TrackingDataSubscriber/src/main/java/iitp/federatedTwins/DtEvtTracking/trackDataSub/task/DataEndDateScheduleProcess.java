package iitp.federatedTwins.DtEvtTracking.trackDataSub.task;

import java.util.HashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ConcurrentHashMap;

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
public class DataEndDateScheduleProcess implements Runnable {

	private final Logger logger = LoggerFactory.getLogger(DataEndDateScheduleProcess.class);

	private String resId;
	private String proId;

	@Autowired
	public TrackingProcessInfoMapper trackingProcessInfoMapper;

	@Autowired
	public TrackingDataSubscriberService trackingDataSubService;

	@Autowired
	public RabbitMQComponent rabbitMQComponent;

	@Autowired
	ConcurrentHashMap<String, ScheduledFuture> dataScheduledFutureInfo;

	@Autowired
	ConcurrentHashMap<String, ScheduledFuture> dataEndDateScheduledFutureInfo;

	@Autowired
	KafkaListenerAutomation kafkaListenerAutomation;

	@Autowired
	ConcurrentHashMap<String, KafkaConsumer> kafkaConsumerinfo; 

	public DataEndDateScheduleProcess(String resId, String proId) {
		this.resId = resId;
		this.proId = proId;
	}	

	@Override
	public void run() {		
		logger.info("DataEndDateScheduleProcess - Start run() ==> "+resId+" : "+proId);
		HashMap<String, Object> pMap = new HashMap<>();

		TrackingProcessInfo trackingProcessInfo = null;

		try {
			HashMap<String, Object> param = new HashMap<>();
			param.put("requestTrackingId", resId);
			param.put("trackingProcessId", proId);
			param.put("trackingStatus", Constant.TRCK_PROC_STATUS_RUNNING);

			trackingProcessInfo = trackingProcessInfoMapper.getTrackingProcessInfo(param);

			ScheduledFuture schFuture = dataScheduledFutureInfo.get(resId + proId);

			if(schFuture != null) {
				schFuture.cancel(true);
				schFuture = null;
				dataScheduledFutureInfo.remove(resId + proId);					
			}

			ScheduledFuture endDtFuture = dataEndDateScheduledFutureInfo.get(resId + proId);

			if(endDtFuture != null) {
				endDtFuture.cancel(true);
				endDtFuture = null;
				dataEndDateScheduledFutureInfo.remove(resId + proId);					
			}

			if(trackingProcessInfo != null) {
				logger.info("topic : {}", trackingProcessInfo.getTrackingKafkaTopic());
				logger.info("requestTrackingId : {}", trackingProcessInfo.getRequestTrackingId());
				logger.info("trackingProcessId : {}", trackingProcessInfo.getTrackingProcessId());

				JSONObject json = new JSONObject();
				json.put("topic", trackingProcessInfo.getTrackingKafkaTopic());
				json.put("requestTrackingId", trackingProcessInfo.getRequestTrackingId());
				json.put("trackingProcessId", trackingProcessInfo.getTrackingProcessId());

				rabbitMQComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TOPIC_DELETE);

			}

			if(trackingProcessInfo != null) {
				if(!Constant.TRCK_PROC_STATUS_COMPLETE.equals(trackingProcessInfo.getTrackingStatus()) 
						&& !Constant.TRCK_PROC_STATUS_ERROR.equals(trackingProcessInfo.getTrackingStatus())						
						){
					pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_COMPLETE);
					pMap.put("reqTrckCmdStatus", Constant.TRCK_CMD_STATUS_COMPLETE);
					pMap.put("trackingProcessId", proId);
					pMap.put("requestTrackingId", resId);
					pMap.put("statusResultMsg", "Data End Date Schedule Process STATUS COMPLETE Update Success");					
				}
			}			
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);

			pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_ERROR);
			pMap.put("reqTrckCmdStatus", Constant.TRCK_CMD_STATUS_ERROR);
			pMap.put("trackingProcessId", proId);
			pMap.put("requestTrackingId", resId);
			pMap.put("statusResultMsg", "Event End Date Schedule Process STATUS ERROR Update Success");
		}finally {
			try {
				if(trackingProcessInfo != null) {
					trackingDataSubService.updateWithHisAndTrackingProcInfo(pMap);					
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

	}
}
