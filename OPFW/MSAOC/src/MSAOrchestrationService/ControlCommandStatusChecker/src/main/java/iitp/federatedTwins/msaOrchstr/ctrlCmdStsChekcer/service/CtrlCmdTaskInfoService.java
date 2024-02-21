package iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.service;

import java.util.HashMap;
import java.util.List;

import iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.vo.CtrlCmdSeqTaskProcVO;

public interface CtrlCmdTaskInfoService {

	public List<Integer> getReqCtrlCmdIdList(HashMap<String, Object> map) throws Exception;

}
