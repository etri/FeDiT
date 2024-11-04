package iitp.federatedTwins.msaOrchstr.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandStatusChangeRecord;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaSequenceStatusChangeRecord;

/**
 * @파일명 : MsaSequenceStatusChangeRecordMapper.java
 * @title : 제어시퀀스 상태변경 이력
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
@Mapper
public interface MsaSequenceStatusChangeRecordMapper {

	List<MsaControlCommandStatusChangeRecord> getSequenceStatusChangeHistoryList(HashMap<String, Object> map)
			throws Exception;

	int insertSequenceStatusChangeHistory(MsaSequenceStatusChangeRecord msaCs) throws Exception;

	int updateSequenceStatusChangeHistory(MsaSequenceStatusChangeRecord msaCs) throws Exception;

	int deleteSequenceStatusChangeHistory(HashMap<String, Object> map) throws Exception;

}
