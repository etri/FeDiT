package iitp.federatedTwins.DtEvtTracking.trackCmdDetector.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;

@Mapper
public interface TrackCmdDetectorMapper {

	List<DataEventTrackingRequestInfo> getControlCommandTaskInfo();

	TrackingTaskSendingInfo getTrackCmdDetector(HashMap<String, Object> map);

	int insertTrackCmdDetector(TrackingResponseRecord rd);

	int updateTrackCmdDetector(TrackingTaskProcessingInfo msa);

	int deleteTrackCmdDetector(HashMap<String, Object> map);

}
