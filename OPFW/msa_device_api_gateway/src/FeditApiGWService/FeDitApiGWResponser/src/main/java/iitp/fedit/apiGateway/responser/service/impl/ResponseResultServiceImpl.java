package iitp.fedit.apiGateway.responser.service.impl;

import java.util.HashMap;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.fedit.apiGateway.common.dto.DigitalTwinExecCtrlCmdInfo;
import iitp.fedit.apiGateway.common.mapper.DigitalTwinExecCtrlCmdInfoMapper;
import iitp.fedit.apiGateway.common.mapper.DigitalTwinRequestCtrlCmdInfoMapper;
import iitp.fedit.apiGateway.common.util.RabbitMQConstant;
import iitp.fedit.apiGateway.responser.component.RabbitMQComponent;
import iitp.fedit.apiGateway.responser.service.ResponseResultService;

@Service
public class ResponseResultServiceImpl implements ResponseResultService {

	@Autowired
	ApplicationContext ctx;

	@Autowired
	DigitalTwinExecCtrlCmdInfoMapper reqCtrlCmdExecMapper;

	@Autowired
	DigitalTwinRequestCtrlCmdInfoMapper reqCtrlCmdInfoMapper;

	private final Logger logger = LoggerFactory.getLogger(ResponseResultServiceImpl.class);

	public ResponseResultServiceImpl() {
	}

	public JSONObject procResponseResultMsg(HashMap<String, Object> map, RabbitMQComponent rabbitMqComponent)
			throws Exception {

		HashMap<String, Object> pMap = new HashMap<>();
		JSONObject json = new JSONObject();

		JSONParser parser = new JSONParser();
		JSONObject jsonCmd = new JSONObject();

		try {
			// 식별자로 실행 명령정보를 조회함. execCtrlCmdIdentifier
			DigitalTwinExecCtrlCmdInfo cmdExecInfo = reqCtrlCmdExecMapper.getDigitalTwinExecCtrlCmdInfo(map);

			if (cmdExecInfo != null) {
				map.put("dgtwReqCtrlCmdId", cmdExecInfo.getDgtwReqCtrlCmdId());
				map.put("dgtwExecCtrlCmdId", cmdExecInfo.getDgtwExecCtrlCmdId());

				json.put("execResultCode", map.get("execResultCode"));
				json.put("execResultValue", map.get("execResultValue"));
				json.put("execResultMsg", map.get("execResultMsg"));

				// 전송에 필요한 ID값 추가
				json.put("dgtwReqCtrlCmdId", map.get("dgtwReqCtrlCmdId"));
				json.put("dgtwExecCtrlCmdId", map.get("dgtwExecCtrlCmdId"));

				// 업데이트가 필요한지 확인 필요
				pMap.put("dgtwReqCtrlCmdId", cmdExecInfo.getDgtwReqCtrlCmdId());
				pMap.put("dgtwExecCtrlCmdId", cmdExecInfo.getDgtwExecCtrlCmdId());
				pMap.put("execCmdStatus", map.get("execResultCode"));
				pMap.put("reqCtrlCmdStatus", map.get("reqCtrlCmdStatus"));

				// 상태 업데이트
				updateDgtwExecCtrlCmdInfo(pMap);

				int nextId = -1;
				// Http Status 중 200만 정상으로 처리
				if (!"200".equals(map.get("execResultCode"))) {
					// 트랜스미터로 실패전송
					// 트랜스미터로 정보가 가면 dgtwReqCtrlCmdId 정보는 삭제된다.
					rabbitMqComponent.sendMessage(json, RabbitMQConstant.APIGATEWAY_RESULT_TRANSMITTER_ROUTING_KEY);
				} else {
					// 다음처리할 대상 확인, 추가된 ID값들로 조회
					nextId = reqCtrlCmdExecMapper.getNextExecCtrlCmdId(map);

					// 다음 진행해야할 실행 명령이 있는지 확인 없으면 -1 리턴
					if (nextId > 0) {
						// 다음처리할 명령 조회 및 프로세서에 전송
						json.clear();
						json.put("dgtwReqCtrlCmdId", map.get("dgtwReqCtrlCmdId"));
						json.put("dgtwExecCtrlCmdId", nextId);

//						Constant.sleep(Thread.currentThread(), 500);

						// value값 만큼 딜레이
//						if(cmdExecInfo.getDgtwExecCtrlCmd() != null && !cmdExecInfo.getDgtwExecCtrlCmd().equals("")) {
//							jsonCmd = (JSONObject) parser.parse(cmdExecInfo.getDgtwExecCtrlCmd()); 
//							if(jsonCmd != null) {
//								if(jsonCmd.get("command").toString().equalsIgnoreCase("Pan") || jsonCmd.get("command").toString().equalsIgnoreCase("Tilt") || jsonCmd.get("command").toString().equalsIgnoreCase("Zoom")) {
//									Constant.sleep(Thread.currentThread(), (1000 * Math.abs(Integer.parseInt(jsonCmd.get("control_value").toString().replaceAll("-", "")))) + 300);
//								}
//							}
//							
//						}

						rabbitMqComponent.sendMessage(json,
								RabbitMQConstant.APIGATEWAY_PROCESSOR_ROUTING_KEY_REQUEST_COMMAND);

					} else {
						// 다음으로 처리해야 할 것이 없다면 전체 시퀀스 성공처리 해야 함.
						// 트랜스미터로 전송
						rabbitMqComponent.sendMessage(json, RabbitMQConstant.APIGATEWAY_RESULT_TRANSMITTER_ROUTING_KEY);
					}
				}
			}

		} catch (Exception e) {
			logger.error("Error message : {}", e);
		}

		return null;
	}

	@Transactional
	private int updateDgtwExecCtrlCmdInfo(HashMap<String, Object> map) throws Exception {

		reqCtrlCmdInfoMapper.updateDigitalTwinRequestCtrlCmdByParam(map);

		return reqCtrlCmdExecMapper.updateDigitalTwinExecCtrlCmdByMap(map);
	}
}
