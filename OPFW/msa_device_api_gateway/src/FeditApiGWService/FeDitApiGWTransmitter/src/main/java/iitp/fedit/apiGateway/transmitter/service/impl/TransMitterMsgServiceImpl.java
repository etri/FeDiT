package iitp.fedit.apiGateway.transmitter.service.impl;

import java.util.HashMap;
import java.util.List;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import iitp.fedit.apiGateway.common.dto.DigitalTwinRequestCtrlCmdInfo;
import iitp.fedit.apiGateway.common.mapper.DigitalTwinExecCtrlCmdInfoMapper;
import iitp.fedit.apiGateway.common.mapper.DigitalTwinRequestCtrlCmdInfoMapper;
import iitp.fedit.apiGateway.transmitter.service.TransMitterMsgService;
import iitp.fedit.apiGateway.transmitter.task.ExecCtrlCmdTransmitTask;

@Service
public class TransMitterMsgServiceImpl implements TransMitterMsgService {
	@Autowired
	ApplicationContext ctx;

	@Autowired
	DigitalTwinRequestCtrlCmdInfoMapper reqCtrlCmdInfoMapper;

	@Autowired
	DigitalTwinExecCtrlCmdInfoMapper reqCtrlCmdExecMapper;

	@Autowired
	@Qualifier("httpTaskExecutor")
	private ThreadPoolTaskExecutor transTaskExecutor;

	private final Logger logger = LoggerFactory.getLogger(TransMitterMsgServiceImpl.class);

	public TransMitterMsgServiceImpl() {
	}

	public JSONObject procTransMitterMsg(HashMap<String, Object> map) throws Exception {
		map.put("procType", "PTM");

		HashMap<String, Object> pMap = new HashMap<>();
		DigitalTwinRequestCtrlCmdInfo reqCmdInfo = null;
		try {
			// 요청정보 확인
			reqCmdInfo = reqCtrlCmdInfoMapper.getDigitalTwinRequestCtrlCmdInfo(map);
			if (reqCmdInfo != null) {
				ExecCtrlCmdTransmitTask transmitTask = ctx.getBean(ExecCtrlCmdTransmitTask.class);
				transmitTask.setParameter(map);
				transTaskExecutor.execute(transmitTask);
			} else {
				throw new Exception(
						"******** CtrlCmdExecService executeTaskProc Request Cmd Info Error ==> Empty Data  ***********");
			}
		} catch (Exception e) {
			logger.error("Error message : {}", e);
		}

		return null;
	}

	public void getReqCtrlCmdListAndDeleteCmd(HashMap<String, Object> map) throws Exception {
		map.put("procType", "STO");
//		controlResult.put("execResultCode", map.get("execResultCode"));	
//		controlResult.put("execResultValue", map.get("execResultValue"));
//		controlResult.put("execResultMsg", map.get("execResultMsg"));

		List<DigitalTwinRequestCtrlCmdInfo> digitalTwinRequestCtrlCmdList = reqCtrlCmdInfoMapper
				.getDigitalTwinRequestCtrlCmdList(map);
		DigitalTwinRequestCtrlCmdInfo digitalTwinRequestCtrlCmdInfo = new DigitalTwinRequestCtrlCmdInfo();

		for (DigitalTwinRequestCtrlCmdInfo reqCmdInfo : digitalTwinRequestCtrlCmdList) {
			try {
				// 요청정보 확인
				if (reqCmdInfo != null) {
					map.put("dgtwReqCtrlCmdId", reqCmdInfo.getDgtwReqCtrlCmdId());
					ExecCtrlCmdTransmitTask transmitTask = ctx.getBean(ExecCtrlCmdTransmitTask.class);
					transmitTask.setParameter(map);
					transTaskExecutor.execute(transmitTask);
				} else {
					throw new Exception(
							"******** CtrlCmdExecService executeTaskProc Request Cmd Info Error ==> Empty Data  ***********");
				}
			} catch (Exception e) {
				logger.error("Error message : {}", e);
			}
		}

	}
}
