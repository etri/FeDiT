package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusChangeRecord;

public interface TrackingStatusChangeRecordMapper {

	List<TrackingStatusChangeRecord> getTrackingStatusChangeHistoryList(HashMap<String, Object> map) throws Exception;

	int insertTrackingStatusChangeHistory(TrackingStatusChangeRecord msaCh) throws Exception;

	int updateTrackingStatusChangeHistory(TrackingStatusChangeRecord msaCh) throws Exception;

	int deleteTrackingStatusChangeHistory(HashMap<String, Object> map) throws Exception;

}
