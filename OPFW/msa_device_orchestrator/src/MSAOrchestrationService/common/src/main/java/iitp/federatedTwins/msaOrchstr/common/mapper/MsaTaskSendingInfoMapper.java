package iitp.federatedTwins.msaOrchstr.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskSendingInfo;

/**
 * @파일명 : MsaTaskSendingInfoMapper.java
 * @title : 제어시퀀스 요청정보 전송 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface MsaTaskSendingInfoMapper {
	List<MsaTaskSendingInfo> getTaskSending(HashMap<String, Object> map) throws Exception;

	int updateTaskSending(MsaTaskSendingInfo map) throws Exception;

	int deleteTaskSending(MsaTaskSendingInfo map) throws Exception;

	int insertTaskSending(MsaTaskSendingInfo map) throws Exception;

	MsaTaskSendingInfo getTaskSendingInfo(HashMap<String, Object> map);
	
	int getTaskSendingTotalCnt(HashMap<String, Object> map);

	MsaControlCommandSequenceInfo getNextSequenceInfo(HashMap<String, Object> map);


}
