package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;

@Mapper
public interface TrackingTaskSendingInfoMapper {

	List<TrackingTaskSendingInfo> getTaskSending(HashMap<String, Object> map) throws Exception;

	int updateTaskSending(TrackingTaskSendingInfo map) throws Exception;

	int deleteTaskSending(TrackingTaskSendingInfo map) throws Exception;

	int insertTaskSending(TrackingTaskSendingInfo map) throws Exception;

	TrackingTaskSendingInfo getTaskSendingInfo(HashMap<String, Object> map);

}
