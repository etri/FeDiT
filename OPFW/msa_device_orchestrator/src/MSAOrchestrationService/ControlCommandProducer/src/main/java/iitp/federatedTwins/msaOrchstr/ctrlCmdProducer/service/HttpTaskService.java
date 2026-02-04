package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service;

import java.util.HashMap;
import java.util.List;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskSendingInfo;

public interface HttpTaskService {
	
	public int getTaskProcessingCount(HashMap<String, Object> map) throws Exception;
	
	public List<MsaControlCommandSequenceInfo> getControlCommandTaskInfoList(HashMap<String, Object> map) throws Exception;
	
	public MsaControlCommandSequenceInfo getControlCommandSequenceInfo(HashMap<String, Object> map) throws Exception;
	
	public MsaTaskProcessingInfo getMsaTaskProcessingInfo(HashMap<String, Object> map) throws Exception;
	
	public int insertTaskProcessing (MsaTaskProcessingInfo map) throws Exception; 
	
	public int updateTaskProcessing (MsaTaskProcessingInfo map) throws Exception;
	
	public int insertTaskSending (MsaTaskSendingInfo map) throws Exception;
	
    public int updateTaskSending (MsaTaskSendingInfo map) throws Exception;
}
