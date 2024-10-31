package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.impl;

import java.util.HashMap;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandStatusChangeRecord;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaControlCommandStatusChangeRecordMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaRequestControlCommandInfoMapper;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.mapper.MsaControlCommandTaskInfoMapper;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.vo.CtrlCmdSeqTaskProcVO;

@Service
public class CtrlCmdTaskInfoServiceImpl implements CtrlCmdTaskInfoService{

	private final MsaControlCommandTaskInfoMapper mapper;

	private final MsaRequestControlCommandInfoMapper reqCtrlCmdMapper;

	private final MsaControlCommandStatusChangeRecordMapper CtrlCmdStsChgHisMapper;

	public CtrlCmdTaskInfoServiceImpl(MsaControlCommandTaskInfoMapper mapper, MsaRequestControlCommandInfoMapper reqCtrlCmdMapper, MsaControlCommandStatusChangeRecordMapper CtrlCmdStsChgHisMapper) {
		this.mapper = mapper;
		this.reqCtrlCmdMapper = reqCtrlCmdMapper;
		this.CtrlCmdStsChgHisMapper = CtrlCmdStsChgHisMapper;
	}

	public HashMap<String, Object> getTotalCountCtrlCmdTaskInfo(HashMap<String, Object> map) throws Exception {
		return this.mapper.getTotalCountCtrlCmdTaskInfo(map);
	}

	public List<Integer> getCtrlCmdSeqIdList(HashMap<String, Object> map) throws Exception {
		return this.mapper.getCtrlCmdSeqIdList(map);
	}

	public CtrlCmdSeqTaskProcVO getControlCommandSequenceTaskProcInfo(HashMap<String, Object> map) throws Exception {
		return mapper.getControlCommandSequenceTaskProcInfo(map);
	}

	@Transactional(readOnly=false, propagation=Propagation.REQUIRED, rollbackFor=Exception.class)
	public int updateCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception {
		return this.mapper.updateCtrlCmdSeqInfoTaskProc(map);
	}

	@Transactional(readOnly=false, propagation=Propagation.REQUIRED, rollbackFor=Exception.class)
	public int updateWithHisAndCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception {
		int proCnt = this.mapper.updateCtrlCmdSeqInfoTaskProc(map);

		//상태정보 업데이트되야 이후 프로세스처리를 진행해야 한다.
		if(proCnt > 0) {
			this.mapper.insertCtrlCmdSeqChangeHisMultiProcInfo(map);			
		}

		return proCnt;
	}
	
	@Transactional(readOnly=false, propagation=Propagation.REQUIRED, rollbackFor=Exception.class)
	public int updateWithHisAndReqCtrlCmdInfo(HashMap<String, Object> map) throws Exception {
		MsaRequestControlCommandInfo reqCtrlCmd = new MsaRequestControlCommandInfo();
		reqCtrlCmd.setRequestControlCommandId((int)map.get("requestControlCommandId"));
		reqCtrlCmd.setReqCtrlCmdStatus((String)map.get("reqCtrlCmdStatus"));

		int proCnt = this.reqCtrlCmdMapper.updateMsaRequestControlCommandInfo(reqCtrlCmd);

		if(proCnt > 0) {
			MsaControlCommandStatusChangeRecord ctrlCmdStsChgHis = new MsaControlCommandStatusChangeRecord();
			ctrlCmdStsChgHis.setRequestControlCommandId((int)map.get("requestControlCommandId"));
			ctrlCmdStsChgHis.setChangeStatus((String)map.get("reqCtrlCmdStatus"));
			ctrlCmdStsChgHis.setStatusResultMsg((String)map.get("statusResultMsg"));

			CtrlCmdStsChgHisMapper.insertControlCommandStatusChangeHistory(ctrlCmdStsChgHis);
		}		
				
		return proCnt;
	}
	

	@Transactional(readOnly=false, propagation=Propagation.REQUIRED, rollbackFor=Exception.class)
	public int updateSingleTaskStatusProc(HashMap<String, Object> map) throws Exception {
		updateWithHisAndCtrlCmdSeqInfoTaskProc(map);

		updateWithHisAndReqCtrlCmdInfo(map);

		return 1;
	}
}
