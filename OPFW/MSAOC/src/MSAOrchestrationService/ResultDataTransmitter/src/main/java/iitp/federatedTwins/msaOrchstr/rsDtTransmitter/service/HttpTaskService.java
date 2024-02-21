package iitp.federatedTwins.msaOrchstr.rsDtTransmitter.service;

import java.util.HashMap;
import java.util.List;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskSendingInfo;

public interface HttpTaskService {

	public List<MsaControlCommandSequenceInfo> getControlCommandSequenceList(HashMap<String, Object> map) throws Exception;

	public int insertTaskProcessing(MsaTaskProcessingInfo map) throws Exception;

	public int insertTaskSending(MsaTaskSendingInfo map) throws Exception;

	public int updateTaskSending(MsaTaskSendingInfo map) throws Exception;
}
