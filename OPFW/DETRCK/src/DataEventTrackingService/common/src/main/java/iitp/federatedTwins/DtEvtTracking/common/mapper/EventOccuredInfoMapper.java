package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.EventOccuredInfo;

/**
 * @파일명 : EventOccuredInfoMapper.java
 * @title : 이벤트 발생 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface EventOccuredInfoMapper {

	EventOccuredInfo getEventOccuredInfo(HashMap<String, Object> map) throws Exception;
	
	List<EventOccuredInfo> getEventOccuredList(HashMap<String, Object> map) throws Exception;

	int getEventOccuredCnt(HashMap<String, Object> map) throws Exception;
	
	int updateEventOccured(EventOccuredInfo eventOccured) throws Exception;

	int deleteEventOccured(EventOccuredInfo eventOccured) throws Exception;

	int insertEventOccured(EventOccuredInfo eventOccured) throws Exception;

}
