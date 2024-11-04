package iitp.federatedTwins.DtEvtTracking.trackDataSub.service;

import java.util.HashMap;
import java.util.List;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;

public interface TrackingDataSubscriberService {

	public TrackingProcessInfo getTrackingProcessInfo(HashMap<String, Object> map) throws Exception;

	public TrackingProcessInfo getDataTrackingDelayProcessInfo(HashMap<String, Object> map) throws Exception;

	public int insertResponseRecordList(List<TrackingResponseRecord> rd) throws Exception;

	public int updateWithHisAndTrackingProcInfo(HashMap<String, Object> map) throws Exception;

	public int deleteTopic(HashMap<String, Object> pMap) throws Exception;

	public int updateWithHisAndTrackingReqInfo(HashMap<String, Object> pMap) throws Exception;
}
