package iitp.federatedTwins.DtEvtTracking.trackDataSub.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;

public interface TrackingDataSubscriberService {

	public TrackingTaskSendingInfo getTaskSendingInfo(HashMap<String, Object> map) throws Exception;

	public int insertMsaReceiveResultData(TrackingResponseRecord rd) throws Exception;

	public int updateTaskProcessing(TrackingTaskProcessingInfo msa) throws Exception;

	public int updateControlCommandSequence(TrackingProcessInfo csi) throws Exception;
	
	public HttpStatus procReceiveResultData(HashMap<String, Object> map) throws Exception;
	
	public Map<String, Integer> getInsertTopic(String topic, int proId, int reqId) throws Exception;
	
	public TrackingProcessInfo getTopics(String topic) throws Exception;
	
	public int getUpdateTopic(String topic, int resId, int proId) throws Exception;

}
