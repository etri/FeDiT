package iitp.federatedTwins.msaOrchstr.rsDtConsumer.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;
import iitp.federatedTwins.msaOrchstr.rsDtConsumer.vo.CtrlCmdSeqTaskProcVO;

@Mapper
public interface MsaControlCommandTaskInfoMapper {

	List<MsaRequestControlCommandInfo> getControlCommandTaskInfo();

	CtrlCmdSeqTaskProcVO getControlCommandSequenceTaskProcInfo(HashMap<String, Object> map);
	
	int updateCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	int insertCtrlCmdSeqChangeHisMultiProcInfo(HashMap<String, Object> map) throws Exception;

}
