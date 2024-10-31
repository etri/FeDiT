package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusChangeRecord;

/**
 * @파일명 : TrackingStatusChangeRecordMapper.java
 * @title : 트래킹 요청정보 상태변경 이력
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface TrackingStatusChangeRecordMapper {

	List<TrackingStatusChangeRecord> getTrackingStatusChangeHistoryList(HashMap<String, Object> map) throws Exception;

	int insertTrackingStatusChangeHistory(TrackingStatusChangeRecord msaCh) throws Exception;

	int updateTrackingStatusChangeHistory(TrackingStatusChangeRecord msaCh) throws Exception;

	int deleteTrackingStatusChangeHistory(HashMap<String, Object> map) throws Exception;

	TrackingStatusChangeRecord getTrackingStatusChangeHistoryInfo(HashMap<String, Object> map) throws Exception;

}
