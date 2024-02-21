package iitp.federatedTwins.DtEvtTracking.trackDataSub.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;

@Mapper
public interface TrackingTaskInfoMapper {

	List<DataEventTrackingRequestInfo> getControlCommandTaskInfo();
	
	int updateTrackingSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	int insertTrackingSeqChangeHisMultiProcInfo(HashMap<String, Object> map) throws Exception;

	List<TrackingProcessInfo> getTrackCmdTaskInfoList(HashMap<String, Object> map);
	
	int insertTrackingResponseRecord(HashMap<String, Object> map);
	
	int updateResponseRecord(HashMap<String, Object> map);
	
}
