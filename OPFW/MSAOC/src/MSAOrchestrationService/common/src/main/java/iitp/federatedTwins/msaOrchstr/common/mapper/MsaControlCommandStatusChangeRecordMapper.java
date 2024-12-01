package iitp.federatedTwins.msaOrchstr.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandStatusChangeRecord;

/**
 * @파일명 : MsaControlCommandStatusChangeRecordMapper.java
 * @title : 제어시퀀스 상태변경 이력
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface MsaControlCommandStatusChangeRecordMapper {

	List<MsaControlCommandStatusChangeRecord> getControlCommandStatusChangeHistoryList(HashMap<String, Object> map)
			throws Exception;

	int insertControlCommandStatusChangeHistory(MsaControlCommandStatusChangeRecord msaCh) throws Exception;

	int updateControlCommandStatusChangeHistory(MsaControlCommandStatusChangeRecord msaCh) throws Exception;

	int deleteControlCommandStatusChangeHistory(HashMap<String, Object> map) throws Exception;

}
