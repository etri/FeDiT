package iitp.fedit.apiGateway.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.fedit.apiGateway.common.dto.CtrlDeviceInfo;

/**
 * @파일명 : CtrlDeviceInfoMapper.java
 * @title : 제어시퀀스 단위 실행 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface CtrlDeviceInfoMapper {

	List<CtrlDeviceInfo> getCtrlDeviceInfoList(HashMap<String, Object> map) throws Exception;

	CtrlDeviceInfo getCtrlDeviceInfo(HashMap<String, Object> map) throws Exception;
	
	int insertCtrlDeviceList(HashMap<String, Object> map) throws Exception;
	
	int updateCtrlDeviceInfo(CtrlDeviceInfo map) throws Exception;
	
	int updateCtrlDeviceInfoByParam(HashMap<String, Object> map) throws Exception;

	int deleteCtrlDeviceInfo(CtrlDeviceInfo map) throws Exception;



}
