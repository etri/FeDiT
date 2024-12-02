package iitp.federatedTwins.msaOrchstr.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskResponseRecord;

/**
 * @파일명 : MsaTaskResponseRecordMapper.java
 * @title : 제어시퀀스 요청 결과 수신 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface MsaTaskResponseRecordMapper {

	List<MsaTaskResponseRecord> getReceiveResultData(HashMap<String, Object> map) throws Exception;

	int insertReceiveResultData(MsaTaskResponseRecord msaCh) throws Exception;

	int updateReceiveResultData(MsaTaskResponseRecord msaCh) throws Exception;

	int deleteReceiveResultData(HashMap<String, Object> map) throws Exception;
}
