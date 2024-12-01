package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingDetectorProcInfo;

/**
 * @파일명 : TrackingDectorProcInfoMapper.java
 * @title : 데이터/이벤트 트래킹 검출 Proc 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface TrackingDectorProcInfoMapper {

	TrackingDetectorProcInfo getTrackingDectorProcInfo(HashMap<String, Object> map) throws Exception;

	int updateTrackingDectorProc(TrackingDetectorProcInfo trackingDetetorProc) throws Exception;
	
	int updateTrackingDectorProcByParam(HashMap<String, Object> map) throws Exception;

	int deleteTrackingDectorProc(TrackingDetectorProcInfo trackingDetetorProc) throws Exception;

	int insertTrackingDectorProc(TrackingDetectorProcInfo trackingDetetorProc) throws Exception;

}
