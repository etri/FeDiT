package iitp.federatedTwins.msaOrchstr.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaResponseControlCommandInfo;

/**
 * @파일명 : MsaResponseControlCommandInfoMapper.java
 * @title : MSA 응답 결과 전송 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface MsaResponseControlCommandInfoMapper {

	List<MsaResponseControlCommandInfo> getResponseControlCommandList(HashMap<String, Object> map) throws Exception;

	int insertResponseControlCommand(MsaResponseControlCommandInfo msaRi) throws Exception;

	int updateResponseControlCommand(MsaResponseControlCommandInfo msaRi) throws Exception;

	int deleteResponseControlCommand(HashMap<String, Object> map) throws Exception;

}
