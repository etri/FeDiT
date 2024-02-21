package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResultDataTransmissionInfo;

@Mapper
public interface TrackingResultDataTransmissionInfoMapper {

	List<TrackingResultDataTransmissionInfo> getTrackingResultDataTransmissionList(HashMap<String, Object> map)
			throws Exception;

	int updateTrackingResultDataTransmission(TrackingResultDataTransmissionInfo map) throws Exception;

	int deleteTrackingResultDataTransmission(TrackingResultDataTransmissionInfo map) throws Exception;

	int insertTrackingResultDataTransmission(TrackingResultDataTransmissionInfo map) throws Exception;

	TrackingResultDataTransmissionInfo getTrackingResultDataTransmissionInfo(HashMap<String, Object> map);

}
