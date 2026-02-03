package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.EventTransmissionResultInfo;

/**
 * @파일명 : EventTransmissionResultInfoMapper.java
 * @title : 트래킹 이벤트 발생 전송 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface EventTransmissionResultInfoMapper {

	List<EventTransmissionResultInfo> getEventTransmissionResultList(HashMap<String, Object> map) throws Exception;

	int insertEventTransmissionResult(EventTransmissionResultInfo eventTransmissionResult) throws Exception;

	int updateEventTransmissionResult(EventTransmissionResultInfo eventTransmissionResult) throws Exception;

	int deleteEventTransmissionResult(EventTransmissionResultInfo eventTransmissionResult) throws Exception;

}
