package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;

@Mapper
public interface TrackingControlTaskInfoMapper {

	List<DataEventTrackingRequestInfo> getTrackingControlTaskInfo(HashMap<String, Object> paramMap);

	DataEventTrackingRequestInfo getDataEventTrackingControlTaskInfo(HashMap<String, Object> paramMap);
}
