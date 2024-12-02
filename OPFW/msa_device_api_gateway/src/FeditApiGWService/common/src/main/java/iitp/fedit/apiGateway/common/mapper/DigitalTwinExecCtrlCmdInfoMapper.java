package iitp.fedit.apiGateway.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.fedit.apiGateway.common.dto.DigitalTwinExecCtrlCmdInfo;

/**
 * @파일명 : DigitalTwinExecCtrlCmdInfoMapper.java
 * @title : 단일 제어 실행 명령정보
 * @작성일 : 2024. 05. 23.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface DigitalTwinExecCtrlCmdInfoMapper {

	List<DigitalTwinExecCtrlCmdInfo> getDigitalTwinExecCtrlCmdList(HashMap<String, Object> map) throws Exception;
	
	int getNextExecCtrlCmdId(HashMap<String, Object> map) throws Exception;
	
	HashMap<String, Object> getNextCtrlCmdId(HashMap<String, Object> map) throws Exception;

	int updateDigitalTwinExecCtrlCmd(DigitalTwinExecCtrlCmdInfo map) throws Exception;
	
	int updateDigitalTwinExecCtrlCmdByMap(HashMap<String, Object> map) throws Exception;
	
	int deleteDigitalTwinExecCtrlCmd(DigitalTwinExecCtrlCmdInfo map) throws Exception;
	
	int deleteDigitalTwinExecCtrlCmdByMap(HashMap<String, Object> map) throws Exception;

	int insertDigitalTwinExecCtrlCmd(DigitalTwinExecCtrlCmdInfo map) throws Exception;

	DigitalTwinExecCtrlCmdInfo getDigitalTwinExecCtrlCmdInfo(HashMap<String, Object> map) throws Exception;

}
