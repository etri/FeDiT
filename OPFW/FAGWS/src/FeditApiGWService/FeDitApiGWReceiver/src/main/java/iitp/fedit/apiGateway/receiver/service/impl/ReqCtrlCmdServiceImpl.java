package iitp.fedit.apiGateway.receiver.service.impl;

import java.util.HashMap;
import java.util.UUID;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.fedit.apiGateway.common.config.MSAConfigurationProperties;
import iitp.fedit.apiGateway.common.dto.CtrlCmdExecCodeInfo;
import iitp.fedit.apiGateway.common.dto.DigitalTwinExecCtrlCmdInfo;
import iitp.fedit.apiGateway.common.dto.DigitalTwinRequestCtrlCmdInfo;
import iitp.fedit.apiGateway.common.mapper.CtrlCmdExecCodeInfoMapper;
import iitp.fedit.apiGateway.common.mapper.DigitalTwinExecCtrlCmdInfoMapper;
import iitp.fedit.apiGateway.common.mapper.DigitalTwinRequestCtrlCmdInfoMapper;
import iitp.fedit.apiGateway.common.util.Constant;
import iitp.fedit.apiGateway.common.util.RabbitMQConstant;
import iitp.fedit.apiGateway.receiver.component.RabbitMQComponent;
import iitp.fedit.apiGateway.receiver.service.ReqCtrlCmdService;

@Service
public class ReqCtrlCmdServiceImpl implements ReqCtrlCmdService {

	@Autowired
	MSAConfigurationProperties msaConfigProp;

	@Autowired
	RabbitMQComponent rabbitMQComponent;

	@Autowired
	private DigitalTwinRequestCtrlCmdInfoMapper digitalTwinRequestCtrlCmdInfoMapper;

	@Autowired
	private CtrlCmdExecCodeInfoMapper ctrlCmdExecCodeInfoMapper;

	@Autowired
	private DigitalTwinExecCtrlCmdInfoMapper digitalTwinExecCtrlCmdInfoMapper;

	@Autowired
	DigitalTwinRequestCtrlCmdInfoMapper reqCtrlCmdInfoMapper;

	private final Logger logger = LoggerFactory.getLogger(ReqCtrlCmdServiceImpl.class);

	public HttpStatus procRequestControlCommand(DigitalTwinRequestCtrlCmdInfo digitalTwinRequestCtrlCmdInfo)
			throws Exception {
		JSONObject bodyJson = new JSONObject();
		HttpStatus resultSts = Constant.HTTP_CREATE_STAT;
		try {
			bodyJson = insertReqCtrlCmdInfo(digitalTwinRequestCtrlCmdInfo);
			// 정상처리
			// 정상일 경우 명령에 대한 수행을 하기위한 처리를 전송
			rabbitMQComponent.sendMessage(bodyJson, RabbitMQConstant.APIGATEWAY_PROCESSOR_ROUTING_KEY_REQUEST_COMMAND);

			resultSts = Constant.HTTP_CREATE_STAT;
		} catch (Exception e) {
			e.printStackTrace();
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
		} finally {
			try {
				HashMap<String, Object> pMap = new HashMap<>();
				pMap.put("reqCtrlCmdStatus", resultSts.value());
				pMap.put("dgtwReqCtrlCmdId", digitalTwinRequestCtrlCmdInfo.getDgtwReqCtrlCmdId());

				updateReqCtrlCmdInfo(pMap);

			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		return resultSts;
	}

	@Transactional
	private void updateReqCtrlCmdInfo(HashMap<String, Object> map) throws Exception {
		reqCtrlCmdInfoMapper.updateDigitalTwinRequestCtrlCmdByParam(map);
	}

	@Transactional
	private JSONObject insertReqCtrlCmdInfo(DigitalTwinRequestCtrlCmdInfo digitalTwinRequestCtrlCmdInfo)
			throws Exception {
		HashMap<String, Object> map = new HashMap<>();
		JSONObject jsonObj = new JSONObject();
		JSONObject json = new JSONObject();
		JSONArray jsonArr = new JSONArray();
		JSONParser parser = new JSONParser();
		String execCodeName = "";
		JSONObject bodyJson = new JSONObject();

		int dgtwExecCtrlCmdId = 0;

		// 상태정보 업데이트
		digitalTwinRequestCtrlCmdInfo.setReqCtrlCmdStatus("00");

		int res = digitalTwinRequestCtrlCmdInfoMapper.insertDigitalTwinRequestCtrlCmd(digitalTwinRequestCtrlCmdInfo);

		if (res > 0) {
			String ctrlCommand = digitalTwinRequestCtrlCmdInfo.getReqCtrlCommand();
			jsonObj = (JSONObject) parser.parse(ctrlCommand);
			jsonArr = (JSONArray) jsonObj.get("commands");

			DigitalTwinExecCtrlCmdInfo digitalTwinExecCtrlCmdInfo = new DigitalTwinExecCtrlCmdInfo();
			for (int i = 0; i < jsonArr.size(); i++) {
				json = (JSONObject) parser.parse(jsonArr.get(i).toString());

				execCodeName = json.get("control_type").toString() + "_" + json.get("command").toString();
				map.put("execCodeName", execCodeName);
				CtrlCmdExecCodeInfo ctrlCmdExecCodeInfo = ctrlCmdExecCodeInfoMapper.getCtrlCmdExecCodeInfo(map);

				digitalTwinExecCtrlCmdInfo.setDgtwReqCtrlCmdId(digitalTwinRequestCtrlCmdInfo.getDgtwReqCtrlCmdId());
				digitalTwinExecCtrlCmdInfo.setDgtwExecCtrlCmd(jsonArr.get(i).toString());
				digitalTwinExecCtrlCmdInfo.setExecCtrlCmdIdentifier(UUID.randomUUID().toString().replaceAll("-", ""));
				digitalTwinExecCtrlCmdInfo.setCtrlKindCode(ctrlCmdExecCodeInfo.getCtrlKindCode());
				digitalTwinExecCtrlCmdInfo.setExecCmdCode(ctrlCmdExecCodeInfo.getCtrlCmdCode());
				digitalTwinExecCtrlCmdInfo.setCtrlCmdParam(json.get("control_value").toString());
				digitalTwinExecCtrlCmdInfo.setExecCmdStatus("00");

				int cnt = digitalTwinExecCtrlCmdInfoMapper.insertDigitalTwinExecCtrlCmd(digitalTwinExecCtrlCmdInfo);
				if (cnt < 1) {
					throw new Exception("******** DigitalTwinExecCtrlCmd Insert Error  ***********");
				}

				if (i == 0)
					dgtwExecCtrlCmdId = digitalTwinExecCtrlCmdInfo.getDgtwExecCtrlCmdId();
			}

			bodyJson.put("dgtwReqCtrlCmdId", digitalTwinRequestCtrlCmdInfo.getDgtwReqCtrlCmdId());
			bodyJson.put("dgtwExecCtrlCmdId", dgtwExecCtrlCmdId);

		} else {
			throw new Exception("******** DigitalTwinExecCtrlCmd Insert Error  ***********");
		}

		return bodyJson;
	}

}
