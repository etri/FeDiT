package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResultDataTransmissionInfo;

/**
 * @파일명 : TrackingResultDataTransmissionInfoMapper.java
 * @title : 트래킹 요청 처리결과 전송 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface TrackingResultDataTransmissionInfoMapper {

	List<TrackingResultDataTransmissionInfo> getTrackingResultDataTransmissionList(HashMap<String, Object> map)
			throws Exception;

	int updateTrackingResultDataTransmission(TrackingResultDataTransmissionInfo map) throws Exception;

	int deleteTrackingResultDataTransmission(TrackingResultDataTransmissionInfo map) throws Exception;

	int insertTrackingResultDataTransmission(TrackingResultDataTransmissionInfo map) throws Exception;

	TrackingResultDataTransmissionInfo getTrackingResultDataTransmissionInfo(HashMap<String, Object> map);

}
