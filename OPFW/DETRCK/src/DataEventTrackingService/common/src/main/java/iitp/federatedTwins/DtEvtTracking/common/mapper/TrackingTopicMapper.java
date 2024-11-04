package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTopicInfo;

/**
 * @파일명 : TrackingTopicMapper.java
 * @title : 트래킹 토픽 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface TrackingTopicMapper {

	int insertTopic(TrackingTopicInfo topicInfo);
	
	List<TrackingTopicInfo> getTopicList(HashMap<String,Object> map);

	TrackingTopicInfo getTopicInfo(HashMap<String,Object> map);
	
	int updateTopic(TrackingTopicInfo topicInfo);

	int deleteTopic(HashMap<String,Object> map);

	
}
