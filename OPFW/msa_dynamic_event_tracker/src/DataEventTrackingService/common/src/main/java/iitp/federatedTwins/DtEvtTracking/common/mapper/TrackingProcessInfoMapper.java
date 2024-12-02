package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;

/**
 * @파일명 : TrackingProcessInfoMapper.java
 * @title : 트래킹 요청 실행 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface TrackingProcessInfoMapper {

	List<TrackingProcessInfo> getTrackingProcessList(HashMap<String, Object> map) throws Exception;

	int updateTrackingProcess(TrackingProcessInfo map) throws Exception;
	
	int updateTrackingProcessByParam(HashMap<String, Object> map) throws Exception;

	int deleteTrackingProcess(TrackingProcessInfo map) throws Exception;

	int insertTrackingProcess(TrackingProcessInfo map) throws Exception;	

	TrackingProcessInfo getTrackingProcessInfo(HashMap<String, Object> map);

	int updateCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	int insertCtrlCmdSeqChangeHisMultiProcInfo(HashMap<String, Object> map) throws Exception;

	
	
}
