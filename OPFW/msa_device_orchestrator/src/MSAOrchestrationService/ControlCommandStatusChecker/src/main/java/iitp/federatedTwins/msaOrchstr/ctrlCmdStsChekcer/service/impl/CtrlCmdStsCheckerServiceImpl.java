package iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaControlCommandStatusChangeRecordMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaRequestControlCommandInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.common.util.RabbitMQConstant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.component.RabbitMQComponent;
import iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.mapper.MsaControlCommandStsCheckerMapper;
import iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.service.CtrlCmdStsCheckerService;

@Service
public class CtrlCmdStsCheckerServiceImpl implements CtrlCmdStsCheckerService {

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdStsCheckerService.class);

	@Autowired
	RabbitMQComponent rabbitMqComponent;

	private final MsaControlCommandStsCheckerMapper reqCtrlCmdStsMapper;

	public CtrlCmdStsCheckerServiceImpl(MsaControlCommandStsCheckerMapper reqCtrlCmdStsMapper,
			MsaRequestControlCommandInfoMapper reqCtrlCmdMapper,
			MsaControlCommandStatusChangeRecordMapper CtrlCmdStsChgHisMapper) {
		this.reqCtrlCmdStsMapper = reqCtrlCmdStsMapper;
	}

	// 에러 상태값 trn 재전송
	public void stsCheckerAndsendTrn() throws Exception {

		try {
			HashMap<String, Object> map = new HashMap<>();
			List<Integer> procReqIdList = new ArrayList<>();

			map.put("sessionCheckStatus", "SSCK");
			procReqIdList = this.reqCtrlCmdStsMapper.getReqCtrlCmdIdList(map);

			logger.info("procReqIdList Size : {}" , procReqIdList.size());

			if (procReqIdList != null && procReqIdList.size() > 0) {
				JSONObject json = new JSONObject();
				for (int i = 0; i < procReqIdList.size(); i++) {
					json.put("requestControlCommandId", procReqIdList.get(i).toString());
					json.put("sessionCheckStatus", "SSCK");
					rabbitMqComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_TGR_EVENT_TRANSMIT);
				}
			}

		} catch (Exception e) {
			logger.error("Error Message : {}", e);
		}

	}

	// CS01/CS02 상태값 업데이트
	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public void timeoutCheckerAndStsUpdate() throws Exception {

		HashMap<String, Object> map = new HashMap<>();
		List<Integer> procReqIdList = new ArrayList<>();
		List<Integer> procReqIdList2 = new ArrayList<>();
		List<Integer> procSeqIdList = new ArrayList<>();
		List<MsaControlCommandSequenceInfo> procReqIdAndSeqIdList = new ArrayList<>();

		// 전체 제어명령 진행상태 체크 command ID Session 체크  => 3분			
		ArrayList reqCtrlCmdStatusList = new ArrayList<String>();
		reqCtrlCmdStatusList.add(Constant.CTRL_CMD_STATUS_READY);
		reqCtrlCmdStatusList.add(Constant.CTRL_CMD_STATUS_SEQ_RUNNING);
						
		map.put("reqCtrlCmdStatusList", reqCtrlCmdStatusList);	
		
		
		map.put("timeSession", Integer.parseInt("-3"));
		map.put("timeUnit", "M");
		procReqIdList = this.reqCtrlCmdStsMapper.getReqCtrlCmdIdList(map);
		
		logger.info("procReqIdList Size : {}" , procReqIdList.size());

		if (procReqIdList != null && procReqIdList.size() > 0) {
			map.put("procReqIdList", procReqIdList);
			map.put("reqCtrlCmdStatus", Constant.CTRL_CMD_STATUS_TIMEOUT);
			this.reqCtrlCmdStsMapper.updateReqCtrlCmdStatus(map);
		}

		// 진행중인 시퀀스 제어 명령 진행상태 체크 시퀀스 ID Session 체크  => 60초
		map.put("reqCtrlCmdStatus", Constant.CTRL_CMD_STATUS_SEQ_RUNNING);
		map.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_RUNNING);
		map.put("timeUnit", "S");
		map.put("timeSession", Integer.parseInt("-60"));
		procReqIdAndSeqIdList = this.reqCtrlCmdStsMapper.getReqCmdIdAndSeqIdList(map);

		logger.info("procReqIdAndSeqIdList Size : {}" , procReqIdAndSeqIdList.size());
		
		if (procReqIdAndSeqIdList != null && procReqIdAndSeqIdList.size() > 0) {
			for (int i = 0; i < procReqIdAndSeqIdList.size(); i++) {
				procReqIdList2.add(procReqIdAndSeqIdList.get(i).getRequestControlCommandId());
				procSeqIdList.add(procReqIdAndSeqIdList.get(i).getCtrlCmdSequenceId());
			}
			
			logger.info("RequestControlCommandId List Size : {}" , procReqIdList2.size());
			map.put("procReqIdList", procReqIdList2);
			map.put("reqCtrlCmdStatus", Constant.CTRL_CMD_STATUS_TIMEOUT);
			map.put("statusResultMsg", "Checker Module TimeOut CheckerAndStsUpdate  ==> "+Constant.CTRL_CMD_STATUS_TIMEOUT);
			
			this.reqCtrlCmdStsMapper.updateReqCtrlCmdStatus(map);
			this.reqCtrlCmdStsMapper.insertReqCtrlCmdChangeHisMultiProcInfo(map);
			

			logger.info("CtrlCmdSequenceId List Size : {}" , procSeqIdList.size());
			map.put("procSeqIdList", procSeqIdList);
			map.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_TIMEOUT);
			this.reqCtrlCmdStsMapper.updateCtrlCmdSeqStatus(map);
			this.reqCtrlCmdStsMapper.insertCtrlCmdSeqChangeHisMultiProcInfo(map);
			
		}
	}

}
