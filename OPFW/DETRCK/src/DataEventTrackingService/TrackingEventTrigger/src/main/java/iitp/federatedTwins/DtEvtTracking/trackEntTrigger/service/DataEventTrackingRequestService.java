package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.vo.TrackingTransmissionVO;

public interface DataEventTrackingRequestService {

	public List<DataEventTrackingRequestInfo> getTrackingControlTaskInfo(HashMap<String, Object> paramMap);

	
	public int UpdateTransmission(TrackingTransmissionVO msa) throws Exception;
	
	public Map<String, Integer> InsertTransmission(TrackingTransmissionVO msa, Map<String, String> mapped) throws Exception;
	
	public DataEventTrackingRequestInfo getDataEventTrackingControlTaskInfo(HashMap<String, Object> paramMap);
	
}
