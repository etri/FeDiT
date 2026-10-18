package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;

@Mapper
public interface TrackingProcessInfoMapper {

	List<TrackingProcessInfo> getTrackingProcessList(HashMap<String, Object> map) throws Exception;

	int updateTrackingProcess(TrackingProcessInfo map) throws Exception;
	
	int updateTrackingProcessByParam(HashMap<String, Object> map) throws Exception;

	String getProcessUuidByIdentifier(HashMap<String, Object> map) throws Exception;

	int updateLastObservedAt(HashMap<String, Object> map) throws Exception;

	List<TrackingProcessInfo> getNgsiPollingTargets(HashMap<String, Object> map) throws Exception;

	int deleteTrackingProcess(TrackingProcessInfo map) throws Exception;

	int insertTrackingProcess(TrackingProcessInfo map) throws Exception;	

	TrackingProcessInfo getTrackingProcessInfo(HashMap<String, Object> map);

	int updateCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	int insertCtrlCmdSeqChangeHisMultiProcInfo(HashMap<String, Object> map) throws Exception;

}
