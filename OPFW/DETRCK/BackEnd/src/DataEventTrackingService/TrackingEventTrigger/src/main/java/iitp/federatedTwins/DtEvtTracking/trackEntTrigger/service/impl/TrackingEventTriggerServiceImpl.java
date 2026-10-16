package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service.impl;

import java.util.HashMap;
import java.util.List;

import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.EventOccuredInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.EventTransmissionResultInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.DataEventTrackingRequestInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.EventOccuredInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.EventTransmissionResultInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingResultDataTransmissionInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.mapper.TrackingControlTaskInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service.TrackingEventTriggerService;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.task.DtEvtTrackingTask;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.task.StatusTransmitTask;

@Service
public class TrackingEventTriggerServiceImpl implements TrackingEventTriggerService {

	private final Logger logger = LoggerFactory.getLogger(TrackingEventTriggerServiceImpl.class);

	@Autowired
	ApplicationContext ctx;
	
	@Autowired(required = false)
	@Qualifier("poolHttpClientConnManager")
	private PoolingHttpClientConnectionManager connManager;
	
	@Autowired	
	@Qualifier("httpTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	@Autowired
	public DataEventTrackingRequestInfoMapper dataEventTrackingRequestInfoMapper;

	@Autowired
	public TrackingControlTaskInfoMapper trackingControlTaskInfoMapper;

	@Autowired
	public EventOccuredInfoMapper eventOccuredInfoMapper;

	@Autowired
	public TrackingResultDataTransmissionInfoMapper trackingResultDataTransmissionInfoMapper;

	@Autowired
	public EventTransmissionResultInfoMapper eventTransmissionResultInfoMapper;

	public List<DataEventTrackingRequestInfo> getTrackingControlTaskInfo(HashMap<String, Object> paramMap) {
		return trackingControlTaskInfoMapper.getTrackingControlTaskInfo(paramMap);
	}

	public DataEventTrackingRequestInfo getDataEventTrackingControlTaskInfo(HashMap<String, Object> paramMap) {
		return trackingControlTaskInfoMapper.getDataEventTrackingControlTaskInfo(paramMap);
	}

	public void transsmiterProcess(HashMap<String, Object> map) throws Exception {
		DtEvtTrackingTask resDataTransmitterTask = ctx.getBean(DtEvtTrackingTask.class);
		
		try {
			resDataTransmitterTask.setParameter(map);
			executor.execute(resDataTransmitterTask);	
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
		}
	}
	
	public void statusTransmitProcess(JSONObject message) throws Exception {
		StatusTransmitTask task = ctx.getBean(StatusTransmitTask.class);
		task.setMessage(message);
		executor.execute(task);
	}

	@Transactional
	public int updateEventTransmissionResultInfo(EventTransmissionResultInfo eventTransmissionResultInfo) throws Exception {
		eventTransmissionResultInfoMapper.insertEventTransmissionResult(eventTransmissionResultInfo);
		
		EventOccuredInfo eventOccuredInfo = new EventOccuredInfo();		
		eventOccuredInfo.setEventOccuredId(eventTransmissionResultInfo.getEventOccuredId());
		eventOccuredInfo.setEventTransMittedStatus(Constant.TRG_EVT_STATUS_COMPLETE);
		
		int count = eventOccuredInfoMapper.updateEventOccured(eventOccuredInfo);
		
		return 1;
	}	
}
