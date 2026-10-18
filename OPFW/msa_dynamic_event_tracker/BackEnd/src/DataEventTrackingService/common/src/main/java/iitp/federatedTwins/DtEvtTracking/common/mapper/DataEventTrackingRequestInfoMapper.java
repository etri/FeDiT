package iitp.federatedTwins.DtEvtTracking.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;

@Mapper
public interface DataEventTrackingRequestInfoMapper {

	List<DataEventTrackingRequestInfo> getDataEventTrackingRequestList(HashMap<String, Object> map) throws Exception;

	DataEventTrackingRequestInfo getDataEventTrackingRequestInfo(HashMap<String, Object> map) throws Exception;
	
	DataEventTrackingRequestInfo getDataEventTrackingRequestInfoParam(HashMap<String, Object> map) throws Exception;

	int insertDataEventTrackingRequest(DataEventTrackingRequestInfo msaRc) throws Exception;

	int updateDataEventTrackingRequest(DataEventTrackingRequestInfo msaRc) throws Exception;

	int deleteDataEventTrackingRequest(HashMap<String, Object> map) throws Exception;

}
