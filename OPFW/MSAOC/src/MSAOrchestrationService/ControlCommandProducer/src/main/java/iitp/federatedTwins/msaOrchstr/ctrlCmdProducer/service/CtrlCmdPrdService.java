package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service;

import java.util.HashMap;
import java.util.List;

import org.springframework.http.HttpStatus;

import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.vo.CtrlCmdSeqTaskProcVO;

public interface CtrlCmdPrdService {

	public HttpStatus executeTaskProc(HashMap<String, Object> map) throws Exception;

	public int updateWithHisAndCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	public HashMap<String, Object> insertTaskProc(HashMap<String, Object> map) throws Exception;
}
