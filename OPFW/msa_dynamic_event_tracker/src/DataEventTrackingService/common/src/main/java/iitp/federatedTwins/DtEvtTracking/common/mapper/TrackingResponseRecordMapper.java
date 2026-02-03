package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;

/**
 * @파일명 : TrackingResponseRecordMapper.java
 * @title : 동적데이터 요청 결과 수신 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface TrackingResponseRecordMapper {

	List<TrackingResponseRecord> getResponseRecord(HashMap<String, Object> map) throws Exception;
	
	TrackingResponseRecord getResponseRecordMaxIdInfo(HashMap<String, Object> map) throws Exception;

	int getResponseRecordCnt(HashMap<String, Object> map) throws Exception;
	
	int insertResponseRecord(TrackingResponseRecord msaCh) throws Exception;

	int updateResponseRecord(TrackingResponseRecord msaCh) throws Exception;

	int deleteResponseRecord(HashMap<String, Object> map) throws Exception;

	int insertResponseRecordList(List<TrackingResponseRecord> record) throws Exception;
}
