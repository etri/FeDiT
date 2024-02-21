package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;

@Mapper
public interface TrackingSequenceInfoMapper {

	List<TrackingProcessInfo> getTrackingSequenceList(HashMap<String, Object> map) throws Exception;

	int updateTrackingSequence(TrackingProcessInfo map) throws Exception;
	
	int updateTrackingSequenceByParam(HashMap<String, Object> map) throws Exception;

	int deleteTrackingSequence(TrackingProcessInfo map) throws Exception;

	int insertTrackingSequence(TrackingProcessInfo map) throws Exception;

	TrackingProcessInfo getTrackingSequenceInfo(HashMap<String, Object> map);

	int updateCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	int insertCtrlCmdSeqChangeHisMultiProcInfo(HashMap<String, Object> map) throws Exception;

	
	
}
