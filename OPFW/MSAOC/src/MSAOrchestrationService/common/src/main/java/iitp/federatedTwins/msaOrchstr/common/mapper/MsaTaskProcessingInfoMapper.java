package iitp.federatedTwins.msaOrchstr.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;

/**
 * @파일명 : MsaTaskProcessingInfoMapper.java
 * @title : 제어시퀀스 Proc 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface MsaTaskProcessingInfoMapper {
	int getTaskProcessingCount(HashMap<String, Object> map) throws Exception;

	List<MsaTaskProcessingInfo> getTaskProcessingList(HashMap<String, Object> map) throws Exception;

	MsaTaskProcessingInfo getTaskProcessingInfo(HashMap<String, Object> map) throws Exception;

	int updateTaskProcessing(MsaTaskProcessingInfo map) throws Exception;

	int deleteTaskProcessing(MsaTaskProcessingInfo map) throws Exception;

//	int insertTaskProcessing(MsaTaskProcessingInfo map) throws Exception;
	
	
	int insertTaskProcessing(MsaTaskProcessingInfo msaTaskProcessingInfo) throws Exception;

}
