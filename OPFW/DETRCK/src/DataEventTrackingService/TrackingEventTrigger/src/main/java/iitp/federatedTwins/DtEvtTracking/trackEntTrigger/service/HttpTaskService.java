package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service;

import java.util.HashMap;
import java.util.List;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;

public interface HttpTaskService {
	
	public List<TrackingProcessInfo> getControlCommandSequenceList(HashMap<String, Object> map) throws Exception;
	
	public int insertTaskProcessing (TrackingTaskProcessingInfo map) throws Exception; 
	
	public int insertTaskSending (TrackingTaskSendingInfo map) throws Exception;
	
    public int updateTaskSending (TrackingTaskSendingInfo map) throws Exception;
}
