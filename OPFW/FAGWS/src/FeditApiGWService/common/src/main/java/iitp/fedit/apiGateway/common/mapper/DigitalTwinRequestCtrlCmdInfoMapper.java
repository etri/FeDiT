package iitp.fedit.apiGateway.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.fedit.apiGateway.common.dto.DigitalTwinRequestCtrlCmdInfo;

/**
 * @파일명 : DigitalTwinRequestCtrlCmdInfoMapper.java
 * @title : 단일 제어시퀀스 요청 정보
 * @작성일 : 2024. 05. 23.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface DigitalTwinRequestCtrlCmdInfoMapper {

	List<DigitalTwinRequestCtrlCmdInfo> getDigitalTwinRequestCtrlCmdList(HashMap<String, Object> map) throws Exception;

	int updateDigitalTwinRequestCtrlCmd(DigitalTwinRequestCtrlCmdInfo map) throws Exception;
	
	int updateDigitalTwinRequestCtrlCmdByParam(HashMap<String, Object> map) throws Exception;
	
	int deleteDigitalTwinRequestCtrlCmd(DigitalTwinRequestCtrlCmdInfo map) throws Exception;

	int insertDigitalTwinRequestCtrlCmd(DigitalTwinRequestCtrlCmdInfo map) throws Exception;

	DigitalTwinRequestCtrlCmdInfo getDigitalTwinRequestCtrlCmdInfo(HashMap<String, Object> map) throws Exception;

	DigitalTwinRequestCtrlCmdInfo getMinRequestCtrlCmdInfo(HashMap<String, Object> map) throws Exception;
}
