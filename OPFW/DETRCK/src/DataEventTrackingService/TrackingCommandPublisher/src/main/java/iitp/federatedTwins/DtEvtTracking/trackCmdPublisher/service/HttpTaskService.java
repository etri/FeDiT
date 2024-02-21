package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service;

import java.util.HashMap;
import java.util.List;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;

public interface HttpTaskService {
	
	public int getTaskProcessingCount(HashMap<String, Object> map) throws Exception;
	
	public List<TrackingProcessInfo> getControlCommandTaskInfoList(HashMap<String, Object> map) throws Exception;
	
	public TrackingProcessInfo getControlCommandSequenceInfo(HashMap<String, Object> map) throws Exception;
	
	public TrackingTaskProcessingInfo getMsaTaskProcessingInfo(HashMap<String, Object> map) throws Exception;
	
	public int insertTaskProcessing (TrackingTaskProcessingInfo map) throws Exception; 
	
	public int updateTaskProcessing (TrackingTaskProcessingInfo map) throws Exception;
	
	public int insertTaskSending (TrackingTaskSendingInfo map) throws Exception;
	
    public int updateTaskSending (TrackingTaskSendingInfo map) throws Exception;
}
