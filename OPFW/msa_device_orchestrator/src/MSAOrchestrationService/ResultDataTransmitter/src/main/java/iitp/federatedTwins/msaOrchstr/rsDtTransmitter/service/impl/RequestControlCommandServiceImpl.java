package iitp.federatedTwins.msaOrchstr.rsDtTransmitter.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaResultDataTransmissionInfo;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaRequestControlCommandInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaResultDataTransmissionInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.mapper.MsaRequestControlTaskInfoMapper;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.service.RequestControlCommandService;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.task.ResDataTransmitterTask;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.vo.RequestTransmissionVO;

@Service
public class RequestControlCommandServiceImpl implements RequestControlCommandService {
	@Autowired
	ApplicationContext ctx;
		
	@Autowired
	@Qualifier("httpTaskExecutor")
	private ThreadPoolTaskExecutor executor;
	
	private final Logger logger = LoggerFactory.getLogger(RequestControlCommandServiceImpl.class);

	@Autowired
	public MsaRequestControlCommandInfoMapper msaRequestControlCommandInfoMapper;

	@Autowired
	public MsaRequestControlTaskInfoMapper msaRequestControlTaskInfoMapper;

	@Autowired
	public MsaResultDataTransmissionInfoMapper msaResultDataTransmissionInfoMapper;

	@Transactional
	public List<MsaRequestControlCommandInfo> getMsaRequestControlTaskInfo(HashMap<String, Object> paramMap) {
		return msaRequestControlTaskInfoMapper.getMsaRequestControlTaskInfo(paramMap);
	}

	@Transactional
	public MsaRequestControlCommandInfo getMsaTransmitterRequestControlTaskInfo(HashMap<String, Object> paramMap) {
		return msaRequestControlTaskInfoMapper.getMsaTransmitterRequestControlTaskInfo(paramMap);
	}

	@Transactional
	public Map<String, Integer> insertTransmission(RequestTransmissionVO msa, Map<String, String> mapped)
			throws Exception {

		Map<String, Integer> rsltMap = new HashMap<String, Integer>();

		int result;
		try {
			MsaResultDataTransmissionInfo mti = new MsaResultDataTransmissionInfo();
			mti.setRequestControlCommandId(msa.getRequestControlCommandId());
			mti.setTransmissionCode(200);
			mti.setTransmissionMsg("OK");
			mti.setTransmissionUrl(msa.getResultCallBackUrl());
			mti.setTransmissionResultData(msa.getTransmissionResultData());
			mti.setTransmissionParam(mapped.toString()); 

			int res = msaResultDataTransmissionInfoMapper.insertResultDataTransmission(mti); 
																							
																								
			if (res < 1)
				throw new Exception("******* CtrCommand Update Error *******");

			rsltMap.put("transmissionId", mti.getTransmissionId());

			logger.debug("Insert ReqCtrlCmdId >>>>>>>>>>>> " + mti.getRequestControlCommandId() + " , Transmission Id >>>>>>>>>>>> " + mti.getTransmissionId());

			result = 1;

		} catch (Exception e) {
			logger.error("Error Message : {}" ,  e);
			result = 0;
		}

		return rsltMap;

	}

	@Transactional
	public int UpdateTransmission(RequestTransmissionVO msa) throws Exception {

		int result;
		try {
			// ctlcmd Update
			MsaRequestControlCommandInfo mcc = new MsaRequestControlCommandInfo();
			mcc.setTransmissionStatus("COMPLETE");
			mcc.setTransmissionTime("TRN");
			mcc.setRequestControlCommandId(msa.getRequestControlCommandId());

			// trans Update
			MsaResultDataTransmissionInfo mti = new MsaResultDataTransmissionInfo();
			mti.setRequestControlCommandId(msa.getRequestControlCommandId());
			mti.setTransmissionId(msa.getTransmissionId());
			mti.setTransmissionResultData(msa.getTransmissionResultData());
			mti.setTransmissionCode(msa.getTransmissionCode());

			// error 처리
			if (msa.getTransmissionResultData().equals(Constant.CTRL_CMD_STATUS_ERROR)) {
				mti.setTransmissionMsg("ERROR");
				mti.setTransmissionCode(500);
			}

			logger.debug("Update ReqCtrlCmdId >>>>>>>>>>>> " + mti.getRequestControlCommandId() + " , TransmissionID >>>>>>>>>>>> " + mti.getTransmissionId());

			mti.setRespCtrlCmdCode(msa.getHttpCode());
			mti.setRespCtrlCmdMsg(msa.getHttpResult());

			int upd = msaRequestControlCommandInfoMapper.updateMsaRequestControlCommandInfo(mcc); 
																									
																								
			if (upd < 1)
				throw new Exception("******* CtrCommand Update Error *******");

			int tup = msaResultDataTransmissionInfoMapper.updateResultDataTransmission(mti);

			if (tup < 1)
				throw new Exception("******* Transmission Update Error ********");

			result = 1;

		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
			result = 0;
		}

		return result;
	}

	public void execTransmitter(HashMap<String, Object> paramMap) throws Exception {		
		ResDataTransmitterTask resDataTransmitterTask = ctx.getBean(ResDataTransmitterTask.class);
				
		try {
			resDataTransmitterTask.setParameter(paramMap);
			executor.execute(resDataTransmitterTask);	
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
		}
		
		
	}

}
