package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.vo.CtrlCmdSeqTaskProcVO;


@Mapper	
public interface MsaControlCommandTaskInfoMapper {

	List<MsaControlCommandSequenceInfo> getControlCommandTaskInfoList(HashMap<String, Object> map);

	List<Integer> getCtrlCmdSeqIdList(HashMap<String, Object> map);

	CtrlCmdSeqTaskProcVO getControlCommandSequenceTaskProcInfo(HashMap<String, Object> map);

	HashMap<String, Object> getTotalCountCtrlCmdTaskInfo(HashMap<String, Object> map) throws Exception;

	int updateCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	int insertCtrlCmdSeqChangeHisMultiProcInfo(HashMap<String, Object> map) throws Exception;

	MsaControlCommandSequenceInfo getControlCommandTaskInfos(HashMap<String, Object> map);
}
