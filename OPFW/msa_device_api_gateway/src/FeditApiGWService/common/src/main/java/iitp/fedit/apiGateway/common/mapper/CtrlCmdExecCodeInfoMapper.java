package iitp.fedit.apiGateway.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.fedit.apiGateway.common.dto.CtrlCmdExecCodeInfo;

/**
 * @파일명 : CtrlDeviceInfoMapper.java
 * @title : 제어시퀀스 단위 실행 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface CtrlCmdExecCodeInfoMapper {

	List<CtrlCmdExecCodeInfo> getCtrlCmdExecCodeInfoList(HashMap<String, Object> map) throws Exception;

	CtrlCmdExecCodeInfo getCtrlCmdExecCodeInfo(HashMap<String, Object> map);
	
	int insertCtrlCmdExecCodeInfo(CtrlCmdExecCodeInfo map) throws Exception;
	
	int updateCtrlCmdExecCodeInfo(CtrlCmdExecCodeInfo map) throws Exception;
	
	int updateCtrlCmdExecCodeInfoByParam(HashMap<String, Object> map) throws Exception;

	int deleteCtrlCmdExecCodeInfoInfo(CtrlCmdExecCodeInfo map) throws Exception;

}
