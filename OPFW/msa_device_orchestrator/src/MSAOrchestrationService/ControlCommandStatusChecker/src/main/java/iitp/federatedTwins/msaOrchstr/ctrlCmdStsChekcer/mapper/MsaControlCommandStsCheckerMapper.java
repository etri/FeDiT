package iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;


@Mapper	
public interface MsaControlCommandStsCheckerMapper {

	int updateReqCtrlCmdStatus(HashMap<String, Object> map);
	int insertReqCtrlCmdChangeHisMultiProcInfo(HashMap<String, Object> map);
	List<Integer> getReqCtrlCmdIdList(HashMap<String, Object> map);


	int updateCtrlCmdSeqStatus(HashMap<String, Object> map);
	int insertCtrlCmdSeqChangeHisMultiProcInfo(HashMap<String, Object> map);
	List<MsaControlCommandSequenceInfo> getReqCmdIdAndSeqIdList(HashMap<String, Object> map);

}
