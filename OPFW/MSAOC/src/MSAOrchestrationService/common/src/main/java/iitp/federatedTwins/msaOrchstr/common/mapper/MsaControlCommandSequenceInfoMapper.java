package iitp.federatedTwins.msaOrchstr.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;

/**
 * @파일명 : MsaControlCommandSequenceInfoMapper.java
 * @title : 제어시퀀스 단위 실행 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface MsaControlCommandSequenceInfoMapper {

	List<MsaControlCommandSequenceInfo> getControlCommandSequenceList(HashMap<String, Object> map) throws Exception;

	int updateControlCommandSequence(MsaControlCommandSequenceInfo map) throws Exception;
	
	int updateControlCommandSequenceByParam(HashMap<String, Object> map) throws Exception;

	int deleteControlCommandSequence(MsaControlCommandSequenceInfo map) throws Exception;

	int insertControlCommandSequence(MsaControlCommandSequenceInfo map) throws Exception;

	MsaControlCommandSequenceInfo getControlCommandSequenceInfo(HashMap<String, Object> map);

}
