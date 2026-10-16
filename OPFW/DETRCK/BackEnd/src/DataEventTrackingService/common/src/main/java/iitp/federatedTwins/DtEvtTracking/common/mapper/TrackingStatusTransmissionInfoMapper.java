package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusTransmissionInfo;

@Mapper
public interface TrackingStatusTransmissionInfoMapper {

	int insertStatusTransmission(TrackingStatusTransmissionInfo info) throws Exception;

	List<TrackingStatusTransmissionInfo> getStatusTransmissionList(HashMap<String, Object> map) throws Exception;

	List<Map<String, Object>> getStatusTransmissionByRequest(HashMap<String, Object> map) throws Exception;

	int getStatusTransmissionCnt(HashMap<String, Object> map) throws Exception;

	int deleteClosedStatusTransmission(HashMap<String, Object> map) throws Exception;
}
