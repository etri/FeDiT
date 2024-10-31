package iitp.federatedTwins.msaOrchstr.rsDtTransmitter.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.vo.RequestTransmissionVO;

public interface RequestControlCommandService {

	public List<MsaRequestControlCommandInfo> getMsaRequestControlTaskInfo(HashMap<String, Object> paramMap);
	
	public MsaRequestControlCommandInfo getMsaTransmitterRequestControlTaskInfo(HashMap<String, Object> paramMap);

	public int UpdateTransmission(RequestTransmissionVO msa) throws Exception;
	
	public Map<String, Integer> insertTransmission(RequestTransmissionVO msa, Map<String, String> mapped) throws Exception;

	public void execTransmitter(HashMap<String, Object> paramMap) throws Exception;

}
