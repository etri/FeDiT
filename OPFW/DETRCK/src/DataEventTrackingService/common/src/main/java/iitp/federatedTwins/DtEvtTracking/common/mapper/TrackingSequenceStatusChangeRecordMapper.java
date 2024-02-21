package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingSequenceStatusChangeRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusChangeRecord;

@Mapper
public interface TrackingSequenceStatusChangeRecordMapper {

	List<TrackingStatusChangeRecord> getSequenceStatusChangeHistoryList(HashMap<String, Object> map) throws Exception;

	int insertSequenceStatusChangeHistory(TrackingSequenceStatusChangeRecord msaCs) throws Exception;

	int updateSequenceStatusChangeHistory(TrackingSequenceStatusChangeRecord msaCs) throws Exception;

	int deleteSequenceStatusChangeHistory(HashMap<String, Object> map) throws Exception;

}
