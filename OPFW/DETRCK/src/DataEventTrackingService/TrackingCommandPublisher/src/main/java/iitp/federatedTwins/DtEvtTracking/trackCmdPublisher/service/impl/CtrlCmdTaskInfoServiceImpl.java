package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.impl;

import java.util.HashMap;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusChangeRecord;
import iitp.federatedTwins.DtEvtTracking.common.mapper.DataEventTrackingRequestInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingStatusChangeRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.mapper.TrackingCommandTaskInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.vo.CtrlCmdSeqTaskProcVO;

@Service
public class CtrlCmdTaskInfoServiceImpl implements CtrlCmdTaskInfoService {

	private final TrackingCommandTaskInfoMapper mapper;

	private final DataEventTrackingRequestInfoMapper reqCtrlCmdMapper;

	private final TrackingStatusChangeRecordMapper CtrlCmdStsChgHisMapper;

	public CtrlCmdTaskInfoServiceImpl(TrackingCommandTaskInfoMapper mapper,
			DataEventTrackingRequestInfoMapper reqCtrlCmdMapper,
			TrackingStatusChangeRecordMapper CtrlCmdStsChgHisMapper) {
		this.mapper = mapper;
		this.reqCtrlCmdMapper = reqCtrlCmdMapper;
		this.CtrlCmdStsChgHisMapper = CtrlCmdStsChgHisMapper;
	}

	public HashMap<String, Object> getTotalCountCtrlCmdTaskInfo(HashMap<String, Object> map) throws Exception {
		return this.mapper.getTotalCountTrackingCmdTaskInfo(map);
	}

	public List<Integer> getCtrlCmdSeqIdList(HashMap<String, Object> map) throws Exception {
		return this.mapper.getTrackingCmdSeqIdList(map);
	}

	public CtrlCmdSeqTaskProcVO getControlCommandSequenceTaskProcInfo(HashMap<String, Object> map) throws Exception {
		return mapper.getTrackingCommandSequenceTaskProcInfo(map);
	}

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public int updateCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception {
		return this.mapper.updateTrackingCmdSeqInfoTaskProc(map);
	}

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public int updateWithHisAndCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception {
		int proCnt = this.mapper.updateTrackingCmdSeqInfoTaskProc(map);

		if (proCnt > 0) {
			this.mapper.insertTrackingCmdSeqChangeHisMultiProcInfo(map);
		}

		return proCnt;
	}

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public int updateSingleTaskStatusProc(HashMap<String, Object> map) throws Exception {
		updateWithHisAndCtrlCmdSeqInfoTaskProc(map);

		DataEventTrackingRequestInfo reqCtrlCmd = new DataEventTrackingRequestInfo();
		reqCtrlCmd.setRequestTrackingId((int) map.get("reqCtrlCmdId"));
		reqCtrlCmd.setReqTrckCmdStatus(Constant.CTRL_CMD_STATUS_ERROR);

		this.reqCtrlCmdMapper.updateDataEventTrackingRequest(reqCtrlCmd);

		TrackingStatusChangeRecord ctrlCmdStsChgHis = new TrackingStatusChangeRecord();
		ctrlCmdStsChgHis.setRequestTrackingId((int) map.get("reqCtrlCmdId"));
		ctrlCmdStsChgHis.setChangeStatus(Constant.CTRL_CMD_STATUS_ERROR);
		ctrlCmdStsChgHis.setStatusResultMsg((String) map.get("statusResultMsg"));

		CtrlCmdStsChgHisMapper.insertTrackingStatusChangeHistory(ctrlCmdStsChgHis);

		return 1;
	}
}
