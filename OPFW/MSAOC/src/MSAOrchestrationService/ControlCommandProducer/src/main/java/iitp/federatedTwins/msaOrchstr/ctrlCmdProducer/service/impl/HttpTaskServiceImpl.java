package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.impl;

import java.util.HashMap;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskSendingInfo;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaControlCommandSequenceInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaTaskProcessingInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaTaskSendingInfoMapper;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.mapper.MsaControlCommandTaskInfoMapper;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.HttpTaskService;

@Service
public class HttpTaskServiceImpl implements HttpTaskService {

	private final MsaControlCommandTaskInfoMapper msaControlCommandTaskInfoMapper;
	private final MsaTaskProcessingInfoMapper msaTaskProcessingInfoMapper;
	private final MsaTaskSendingInfoMapper msaTaskSendingInfoMapper;
	private final MsaControlCommandSequenceInfoMapper msaCtrlSeqInfoMapper;

	public HttpTaskServiceImpl(MsaControlCommandTaskInfoMapper msaControlCommandTaskInfoMapper,
			MsaTaskProcessingInfoMapper msaTaskProcessingInfoMapper,
			MsaTaskSendingInfoMapper msaTaskSendingInfoMapper,
			MsaControlCommandSequenceInfoMapper msaCtrlSeqInfoMapper) {
		this.msaControlCommandTaskInfoMapper = msaControlCommandTaskInfoMapper;
		this.msaTaskProcessingInfoMapper = msaTaskProcessingInfoMapper;
		this.msaTaskSendingInfoMapper = msaTaskSendingInfoMapper;
		this.msaCtrlSeqInfoMapper = msaCtrlSeqInfoMapper;
	}

	public int getTaskProcessingCount(HashMap<String, Object> map) throws Exception {
		return  msaTaskProcessingInfoMapper.getTaskProcessingCount(map);
	}

	@Override
	public List<MsaControlCommandSequenceInfo> getControlCommandTaskInfoList(HashMap<String, Object> map) throws Exception {
		return  msaControlCommandTaskInfoMapper.getControlCommandTaskInfoList(map);
	}

	@Transactional
	public int insertTaskProcessing(MsaTaskProcessingInfo map) throws Exception {	
		return msaTaskProcessingInfoMapper.insertTaskProcessing(map);
	}

	@Transactional
	public int updateTaskProcessing(MsaTaskProcessingInfo map) throws Exception {
		return msaTaskProcessingInfoMapper.updateTaskProcessing(map);
	}


	@Transactional
	public int insertTaskSending(MsaTaskSendingInfo map) throws Exception {
		return msaTaskSendingInfoMapper.insertTaskSending(map);
	}

	@Override
	@Transactional
	public int updateTaskSending(MsaTaskSendingInfo map) throws Exception {
		return msaTaskSendingInfoMapper.updateTaskSending(map);
	}

	public MsaControlCommandSequenceInfo getControlCommandSequenceInfo(HashMap<String, Object> map) throws Exception {
		return this.msaCtrlSeqInfoMapper.getControlCommandSequenceInfo(map);
	}

	public MsaTaskProcessingInfo getMsaTaskProcessingInfo(HashMap<String, Object> map) throws Exception {
		return msaTaskProcessingInfoMapper.getTaskProcessingInfo(map);
	}

}
