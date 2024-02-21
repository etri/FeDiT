package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.EventOccuredInfo;

@Mapper
public interface EventOccuredInfoMapper {

	List<EventOccuredInfo> getEventOccuredList(HashMap<String, Object> map) throws Exception;

	int updateEventOccured(EventOccuredInfo eventOccured) throws Exception;

	int deleteEventOccured(EventOccuredInfo eventOccured) throws Exception;

	int insertEventOccured(EventOccuredInfo eventOccured) throws Exception;

}
