package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessStatusChangeRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusChangeRecord;

/**
 * @파일명 : TrackingSequenceStatusChangeRecordMapper.java
 * @title : 트래킹 요청 상태 변경 이력
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface TrackingProcessStatusChangeRecordMapper {

	List<TrackingStatusChangeRecord> getProcessStatusChangeHistoryList(HashMap<String, Object> map) throws Exception;

	int insertProcessStatusChangeHistory(TrackingProcessStatusChangeRecord msaCs) throws Exception;

	int insertTrackingProcChangeHisMultiList(HashMap<String, Object> map) throws Exception;
	
	int updateProcessStatusChangeHistory(TrackingProcessStatusChangeRecord msaCs) throws Exception;

	int deleteProcessStatusChangeHistory(HashMap<String, Object> map) throws Exception;

}
