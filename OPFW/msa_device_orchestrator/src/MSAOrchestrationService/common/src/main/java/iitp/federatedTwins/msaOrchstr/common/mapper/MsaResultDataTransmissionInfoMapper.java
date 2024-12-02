package iitp.federatedTwins.msaOrchstr.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaResultDataTransmissionInfo;

/**
 * @파일명 : MsaResultDataTransmissionInfoMapper.java
 * @title : MSA 요청 처리결과 전송 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface MsaResultDataTransmissionInfoMapper {

	List<MsaResultDataTransmissionInfo> getResultDataTransmissionList(HashMap<String, Object> map) throws Exception;

	int insertResultDataTransmission(MsaResultDataTransmissionInfo msaRt) throws Exception;

	int updateResultDataTransmission(MsaResultDataTransmissionInfo msaRt) throws Exception;

	int deleteResultDataTransmission(HashMap<String, Object> map) throws Exception;

}
