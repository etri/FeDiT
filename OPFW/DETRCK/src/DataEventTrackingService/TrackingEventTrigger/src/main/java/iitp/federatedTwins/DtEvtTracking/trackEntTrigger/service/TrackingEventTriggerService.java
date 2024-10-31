package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service;

import java.util.HashMap;
import java.util.List;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.EventTransmissionResultInfo;

public interface TrackingEventTriggerService {

	public List<DataEventTrackingRequestInfo> getTrackingControlTaskInfo(HashMap<String, Object> paramMap);

	
	public DataEventTrackingRequestInfo getDataEventTrackingControlTaskInfo(HashMap<String, Object> paramMap);

	public void transsmiterProcess(HashMap<String, Object> map) throws Exception;
	
	public int updateEventTransmissionResultInfo(EventTransmissionResultInfo eventTransmissionResultInfo) throws Exception;
}
