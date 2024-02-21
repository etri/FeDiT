package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;

@Mapper
public interface TrackingResponseRecordMapper {

	List<TrackingResponseRecord> getResponseRecord(HashMap<String, Object> map) throws Exception;

	int insertResponseRecord(TrackingResponseRecord msaCh) throws Exception;

	int updateResponseRecord(TrackingResponseRecord msaCh) throws Exception;

	int deleteResponseRecord(HashMap<String, Object> map) throws Exception;
}
