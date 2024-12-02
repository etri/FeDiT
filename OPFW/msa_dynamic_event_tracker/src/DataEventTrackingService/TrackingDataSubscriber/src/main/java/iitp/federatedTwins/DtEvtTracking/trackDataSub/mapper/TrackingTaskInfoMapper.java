package iitp.federatedTwins.DtEvtTracking.trackDataSub.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseDataInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;

@Mapper
public interface TrackingTaskInfoMapper {

	List<DataEventTrackingRequestInfo> getControlCommandTaskInfo();
	
	int updateTrackingSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	int insertTrackingSeqChangeHisMultiProcInfo(HashMap<String, Object> map) throws Exception;

	List<TrackingProcessInfo> getTrackCmdTaskInfoList(HashMap<String, Object> map);
	
	TrackingProcessInfo getTrackingTaskInfo(HashMap<String, Object> map)throws Exception;
	
	int insertTrackingResponseRecord(HashMap<String, Object> map);
	
	int updateResponseRecord(HashMap<String, Object> map);

	TrackingResponseRecord getDTResponseRecord(HashMap<String, Object> map);

	TrackingResponseRecord getDTResponseRecordEventDelay(HashMap<String, Object> map);
	
	int insertResultValue(HashMap<String, Object> map);

	TrackingResponseDataInfo getTrackingResData(HashMap<String, Object> map);

	int updateResultValue(HashMap<String, Object> map);
	
	int insertTrackingProcChangeHisMultiList(HashMap<String, Object> map);
}
