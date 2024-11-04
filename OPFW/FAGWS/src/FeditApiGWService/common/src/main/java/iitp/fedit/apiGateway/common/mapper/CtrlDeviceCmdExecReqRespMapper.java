package iitp.fedit.apiGateway.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.fedit.apiGateway.common.dto.CtrlDeviceCmdExecReqResp;

/**
 * @파일명 : CtrlDeviceCmdExecReqRespMapper.java
 * @title : 제어시퀀스 단위 실행 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface CtrlDeviceCmdExecReqRespMapper {

	List<CtrlDeviceCmdExecReqResp> getCtrlDeviceCmdExecReqRespList(HashMap<String, Object> map) throws Exception;

	CtrlDeviceCmdExecReqResp getCtrlDeviceCmdExecReqResp(HashMap<String, Object> map);
	
	int insertCtrlDeviceCmdExecReqResp(CtrlDeviceCmdExecReqResp map) throws Exception;
	
	int updateCtrlDeviceCmdExecReqResp(CtrlDeviceCmdExecReqResp map) throws Exception;
	
	int updateCtrlDeviceCmdExecReqRespByParam(HashMap<String, Object> map) throws Exception;

	int deleteCtrlDeviceCmdExecReqResp(CtrlDeviceCmdExecReqResp map) throws Exception;

	int insertCtrlDeviceCmdExecReqRespList(HashMap<String,Object> map) throws Exception;

	int updateCtrlDeviceCmdExecReqRespList(HashMap<String, Object> map) throws Exception;

	int removeCtrlDeviceCmdExecReqResp(HashMap<String, Object> map) throws Exception;

}
