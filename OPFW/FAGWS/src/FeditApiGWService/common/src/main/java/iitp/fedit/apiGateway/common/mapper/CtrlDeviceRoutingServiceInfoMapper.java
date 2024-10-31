package iitp.fedit.apiGateway.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.fedit.apiGateway.common.dto.CtrlDeviceRoutingServiceInfo;

/**
 * @파일명 : CtrlDeviceRoutingServiceInfoMapper.java
 * @title : 제어시퀀스 단위 실행 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface CtrlDeviceRoutingServiceInfoMapper {

	List<CtrlDeviceRoutingServiceInfo> getCtrlDeviceRoutingServiceInfoList(HashMap<String, Object> map) throws Exception;

	CtrlDeviceRoutingServiceInfo getCtrlDeviceRoutingServiceInfo(HashMap<String, Object> map) throws Exception;
	
	int insertCtrlDeviceRoutingServiceList(HashMap<String,Object> map) throws Exception;
	
	int insertCtrlDeviceRoutingServiceInfo(CtrlDeviceRoutingServiceInfo map) throws Exception;
	
	int updateCtrlDeviceRoutingServiceList(HashMap<String, Object> map) throws Exception;
	
	int updateCtrlDeviceRoutingServiceInfoByParam(HashMap<String, Object> map) throws Exception;
	
	int updateCtrlDeviceRoutingServiceInfo(CtrlDeviceRoutingServiceInfo map) throws Exception;

	int deleteCtrlDeviceRoutingServiceInfo(CtrlDeviceRoutingServiceInfo map) throws Exception;

	int removeCtrlDeviceRoutingServiceInfo(HashMap<String, Object> map) throws Exception;

}
