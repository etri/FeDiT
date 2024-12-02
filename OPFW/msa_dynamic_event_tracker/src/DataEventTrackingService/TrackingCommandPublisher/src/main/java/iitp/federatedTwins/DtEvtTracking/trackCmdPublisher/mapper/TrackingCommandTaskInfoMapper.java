package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;

@Mapper
public interface TrackingCommandTaskInfoMapper {

	int updateTrackingProcessInfoMap(HashMap<String, Object> map) throws Exception;

	int insertTrackingProcChangeHisMultiList(HashMap<String, Object> map) throws Exception;

	List<TrackingProcessInfo> getTrackCmdProcInfoList(HashMap<String, Object> map);

}
