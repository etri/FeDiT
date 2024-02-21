package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingDetectorProcInfo;

@Mapper
public interface TrackingDectorProcInfoMapper {

	List<TrackingDetectorProcInfo> getTrackingDectorProcList(HashMap<String, Object> map) throws Exception;

	int updateTrackingDectorProc(TrackingDetectorProcInfo trackingDetetorProc) throws Exception;

	int deleteTrackingDectorProc(TrackingDetectorProcInfo trackingDetetorProc) throws Exception;

	int insertTrackingDectorProc(TrackingDetectorProcInfo trackingDetetorProc) throws Exception;

}
