package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingDetectorProcInfo;

@Mapper
public interface TrackingDectorProcInfoMapper {

	TrackingDetectorProcInfo getTrackingDectorProcInfo(HashMap<String, Object> map) throws Exception;

	int updateTrackingDectorProc(TrackingDetectorProcInfo trackingDetetorProc) throws Exception;
	
	int updateTrackingDectorProcByParam(HashMap<String, Object> map) throws Exception;

	int deleteTrackingDectorProc(TrackingDetectorProcInfo trackingDetetorProc) throws Exception;

	int insertTrackingDectorProc(TrackingDetectorProcInfo trackingDetetorProc) throws Exception;

}
