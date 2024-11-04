package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;

/**
 * @파일명 : DataEventTrackingRequestInfoMapper.java
 * @title : 동적 데이터/이벤트 트래킹 요청 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface DataEventTrackingRequestInfoMapper {

	List<DataEventTrackingRequestInfo> getDataEventTrackingRequestList(HashMap<String, Object> map) throws Exception;

	DataEventTrackingRequestInfo getDataEventTrackingRequestInfo(HashMap<String, Object> map) throws Exception;

	int insertDataEventTrackingRequest(DataEventTrackingRequestInfo msaRc) throws Exception;

	int updateDataEventTrackingRequest(DataEventTrackingRequestInfo msaRc) throws Exception;

	int deleteDataEventTrackingRequest(HashMap<String, Object> map) throws Exception;

}
