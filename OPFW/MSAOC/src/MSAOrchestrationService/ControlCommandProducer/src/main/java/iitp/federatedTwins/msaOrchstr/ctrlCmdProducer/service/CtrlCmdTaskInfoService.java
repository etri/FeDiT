package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service;

import java.util.HashMap;
import java.util.List;

import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.vo.CtrlCmdSeqTaskProcVO;

public interface CtrlCmdTaskInfoService {
	public HashMap<String, Object> getTotalCountCtrlCmdTaskInfo(HashMap<String, Object> map) throws Exception;

	public List<Integer> getCtrlCmdSeqIdList(HashMap<String, Object> map) throws Exception;

	public CtrlCmdSeqTaskProcVO getControlCommandSequenceTaskProcInfo(HashMap<String, Object> map) throws Exception;

	public int updateCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	public int updateWithHisAndCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	public int updateSingleTaskStatusProc(HashMap<String, Object> map) throws Exception;
}
