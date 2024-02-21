package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.EventTransmissionResultInfo;

@Mapper
public interface EventTransmissionResultInfoMapper {

	List<EventTransmissionResultInfo> getEventTransmissionResultList(HashMap<String, Object> map) throws Exception;

	int insertEventTransmissionResult(EventTransmissionResultInfo eventTransmissionResult) throws Exception;

	int updateEventTransmissionResult(EventTransmissionResultInfo eventTransmissionResult) throws Exception;

	int deleteEventTransmissionResult(EventTransmissionResultInfo eventTransmissionResult) throws Exception;

}
