package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessStatusChangeRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusChangeRecord;

@Mapper
public interface TrackingProcessStatusChangeRecordMapper {

	List<TrackingStatusChangeRecord> getProcessStatusChangeHistoryList(HashMap<String, Object> map) throws Exception;

	List<Map<String, Object>> getProcessStatusChangeHistoryByRequest(HashMap<String, Object> map) throws Exception;

	int insertProcessStatusChangeHistory(TrackingProcessStatusChangeRecord msaCs) throws Exception;

	int insertTrackingProcChangeHisMultiList(HashMap<String, Object> map) throws Exception;
	
	int updateProcessStatusChangeHistory(TrackingProcessStatusChangeRecord msaCs) throws Exception;

	int deleteProcessStatusChangeHistory(HashMap<String, Object> map) throws Exception;

}
