package iitp.federatedTwins.DtEvtTracking.trackCmdDetector.service;

import java.util.HashMap;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;

public interface TrackCmdDetectorService {

	public TrackingTaskSendingInfo getTrackCmdDetector(HashMap<String, Object> map) throws Exception;

	public int insertTrackCmdDetector(TrackingResponseRecord rd) throws Exception;

	public int updateTrackCmdDetector(TrackingTaskProcessingInfo msa) throws Exception;

	public int deleteTrackCmdDetector(HashMap<String, Object> map) throws Exception;
}
