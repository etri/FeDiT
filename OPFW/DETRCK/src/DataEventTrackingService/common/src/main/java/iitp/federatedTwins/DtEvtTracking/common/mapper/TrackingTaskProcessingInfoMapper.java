package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;

/**
 * @파일명 : TrackingTaskProcessingInfoMapper.java
 * @title : 동적 데이터 요청 Proc 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface TrackingTaskProcessingInfoMapper {

	int getTaskProcessingCount(HashMap<String, Object> map) throws Exception;

	List<TrackingTaskProcessingInfo> getTaskProcessingList(HashMap<String, Object> map) throws Exception;

	TrackingTaskProcessingInfo getTaskProcessingInfo(HashMap<String, Object> map) throws Exception;

	int updateTaskProcessing(TrackingTaskProcessingInfo map) throws Exception;

	int deleteTaskProcessing(TrackingTaskProcessingInfo map) throws Exception;

	int insertTaskProcessing(TrackingTaskProcessingInfo map) throws Exception;

}
