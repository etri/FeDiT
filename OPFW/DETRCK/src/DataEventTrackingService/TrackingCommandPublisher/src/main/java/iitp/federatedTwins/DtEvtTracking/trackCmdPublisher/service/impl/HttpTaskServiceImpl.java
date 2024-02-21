package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.impl;

import java.util.HashMap;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingSequenceInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingTaskProcessingInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingTaskSendingInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.mapper.TrackingCommandTaskInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.HttpTaskService;

@Service
public class HttpTaskServiceImpl implements HttpTaskService {

	private final TrackingCommandTaskInfoMapper msaControlCommandTaskInfoMapper;
	private final TrackingTaskProcessingInfoMapper msaTaskProcessingInfoMapper;
	private final TrackingTaskSendingInfoMapper msaTaskSendingInfoMapper;
	private final TrackingSequenceInfoMapper msaCtrlSeqInfoMapper;

	public HttpTaskServiceImpl(TrackingCommandTaskInfoMapper msaControlCommandTaskInfoMapper,
			TrackingTaskProcessingInfoMapper msaTaskProcessingInfoMapper,
			TrackingTaskSendingInfoMapper msaTaskSendingInfoMapper,
			TrackingSequenceInfoMapper msaCtrlSeqInfoMapper) {
		this.msaControlCommandTaskInfoMapper = msaControlCommandTaskInfoMapper;
		this.msaTaskProcessingInfoMapper = msaTaskProcessingInfoMapper;
		this.msaTaskSendingInfoMapper = msaTaskSendingInfoMapper;
		this.msaCtrlSeqInfoMapper = msaCtrlSeqInfoMapper;
	}

	public int getTaskProcessingCount(HashMap<String, Object> map) throws Exception {
		return  msaTaskProcessingInfoMapper.getTaskProcessingCount(map);
	}

	@Override
	public List<TrackingProcessInfo> getControlCommandTaskInfoList(HashMap<String, Object> map) throws Exception {
		return  msaControlCommandTaskInfoMapper.getTrackingCommandTaskInfoList(map);
	}

	@Transactional
	public int insertTaskProcessing(TrackingTaskProcessingInfo map) throws Exception {	
		return msaTaskProcessingInfoMapper.insertTaskProcessing(map);
	}

	@Transactional
	public int updateTaskProcessing(TrackingTaskProcessingInfo map) throws Exception {
		return msaTaskProcessingInfoMapper.updateTaskProcessing(map);
	}


	@Transactional
	public int insertTaskSending(TrackingTaskSendingInfo map) throws Exception {
		return msaTaskSendingInfoMapper.insertTaskSending(map);
	}

	@Override
	@Transactional
	public int updateTaskSending(TrackingTaskSendingInfo map) throws Exception {
		return msaTaskSendingInfoMapper.updateTaskSending(map);
	}

	public TrackingProcessInfo getControlCommandSequenceInfo(HashMap<String, Object> map) throws Exception {
		return this.msaCtrlSeqInfoMapper.getTrackingSequenceInfo(map);
	}

	public TrackingTaskProcessingInfo getMsaTaskProcessingInfo(HashMap<String, Object> map) throws Exception {
		return msaTaskProcessingInfoMapper.getTaskProcessingInfo(map);
	}

}
