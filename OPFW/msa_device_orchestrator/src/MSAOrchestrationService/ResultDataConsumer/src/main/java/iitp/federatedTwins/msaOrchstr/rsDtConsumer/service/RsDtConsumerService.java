package iitp.federatedTwins.msaOrchstr.rsDtConsumer.service;

import java.util.HashMap;

import org.springframework.http.HttpStatus;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskResponseRecord;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskSendingInfo;
import iitp.federatedTwins.msaOrchstr.rsDtConsumer.vo.CtrlCmdSeqTaskProcVO;

public interface RsDtConsumerService {

	public MsaTaskSendingInfo getTaskSendingInfo(HashMap<String, Object> map) throws Exception;

	public int insertMsaReceiveResultData(MsaTaskResponseRecord rd) throws Exception;

	public int updateTaskProcessing(MsaTaskProcessingInfo msa) throws Exception;

	public int updateControlCommandSequence(MsaControlCommandSequenceInfo csi) throws Exception;

	public HashMap<String, Object> regReceiveResultData(HashMap<String, Object> map) throws Exception;
	
	public HttpStatus procReceiveResultData(HashMap<String, Object> map) throws Exception;
	
	public CtrlCmdSeqTaskProcVO getControlCommandSequenceTaskProcInfo(HashMap<String, Object> map) throws Exception;
}
