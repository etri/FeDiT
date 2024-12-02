package iitp.federatedTwins.msaOrchstr.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;

/**
 * @파일명 : MsaRequestControlCommandInfoMapper.java
 * @title : MSA 제어명령 요청 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface MsaRequestControlCommandInfoMapper {

	List<MsaRequestControlCommandInfo> getMsaRequestControlCommandList(HashMap<String, Object> map) throws Exception;

	int insertMsaRequestControlCommandInfo(MsaRequestControlCommandInfo msaRc) throws Exception;

	int updateMsaRequestControlCommandInfo(MsaRequestControlCommandInfo msaRc) throws Exception;
	
	int updateMsaRequestControlCommandInfobyParam(HashMap<String, Object> map) throws Exception;

	int deleteMsaRequestControlCommandInfo(HashMap<String, Object> map) throws Exception;

}
