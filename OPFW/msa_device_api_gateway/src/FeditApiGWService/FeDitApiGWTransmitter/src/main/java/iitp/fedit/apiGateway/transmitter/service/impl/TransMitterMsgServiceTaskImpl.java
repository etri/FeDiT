package iitp.fedit.apiGateway.transmitter.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.net.URIBuilder;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import iitp.fedit.apiGateway.common.config.MSAConfigurationProperties;
import iitp.fedit.apiGateway.common.dto.DigitalTwinRequestCtrlCmdInfo;
import iitp.fedit.apiGateway.common.mapper.DigitalTwinExecCtrlCmdInfoMapper;
import iitp.fedit.apiGateway.common.mapper.DigitalTwinRequestCtrlCmdInfoMapper;
import iitp.fedit.apiGateway.common.util.Constant;
import iitp.fedit.apiGateway.common.util.RabbitMQConstant;
import iitp.fedit.apiGateway.transmitter.component.RabbitMQComponent;

@Service
public class TransMitterMsgServiceTaskImpl {// implements TransMitterMsgService{

	@Autowired
	MSAConfigurationProperties msaConfigProp;

	@Autowired
	DigitalTwinRequestCtrlCmdInfoMapper reqCtrlCmdInfoMapper;

	@Autowired
	DigitalTwinExecCtrlCmdInfoMapper reqCtrlCmdExecMapper;

	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;

	private final Logger logger = LoggerFactory.getLogger(TransMitterMsgServiceTaskImpl.class);

	public TransMitterMsgServiceTaskImpl() {
	}

	public JSONObject procTransMitterMsg(HashMap<String, Object> map, RabbitMQComponent rabbitMqComponent)
			throws Exception {

		HashMap<String, Object> pMap = new HashMap<>();
		DigitalTwinRequestCtrlCmdInfo reqCmdInfo = null;
		try {
//			DigitalTwinExecCtrlCmdInfo cmdExecInfo = reqCtrlCmdExecMapper.getDigitalTwinExecCtrlCmdInfo(map);
//			
//			if(cmdExecInfo != null) {
			// 요청정보 확인
			reqCmdInfo = reqCtrlCmdInfoMapper.getDigitalTwinRequestCtrlCmdInfo(map);

			if (reqCmdInfo != null) {
				for (int a = 0; a < 3; a++) {
					if (executeHttpConnection(map, reqCmdInfo)) {
						break;
					}

				}
			} else {
				throw new Exception(
						"******** CtrlCmdExecService executeTaskProc Request Cmd Info Error ==> Empty Data  ***********");
			}
		} catch (Exception e) {
			logger.error("Error message : {}", e);
		} finally {

			try {
				if (reqCmdInfo != null) {
					reqCtrlCmdInfoMapper.deleteDigitalTwinRequestCtrlCmd(reqCmdInfo);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}

			// 다음처리할 대상 확인, 준비 상태인것만 가지고 온다.
			map.put("reqCtrlCmdStatus", "00");
			HashMap<String, Object> data = reqCtrlCmdExecMapper.getNextCtrlCmdId(map);


			int nextCmdId = -1, nextExecId = -1;
			if (data != null && data.get("nextCmdId") != null && data.get("nextExecId") != null) {
				nextCmdId = Integer.parseInt(String.valueOf(data.get("nextCmdId")));
				nextExecId = Integer.parseInt(String.valueOf(data.get("nextExecId")));

				if (nextCmdId > 0 && nextExecId > 0) {
					// 다음으로 연결되는 명령어가 있다는 의미 계속 처리해야하는 명령어를 전달함.
					JSONObject json = new JSONObject();
					json.put("dgtwReqCtrlCmdId", nextCmdId);
					json.put("dgtwExecCtrlCmdId", nextExecId);

					Constant.sleep(Thread.currentThread(), 500);

					rabbitMqComponent.sendMessage(json,
							RabbitMQConstant.APIGATEWAY_PROCESSOR_ROUTING_KEY_REQUEST_COMMAND);
				}
			}
		}

		return null;
	}

	protected String statusCode;

	protected boolean returnBool = false;

	protected boolean executeHttpConnection(HashMap<String, Object> map, DigitalTwinRequestCtrlCmdInfo reqCmdInfo) {
		String requestUrl = null;

		try {

			// "/{target_dt_id}/control-results/{device_id}"

			URIBuilder uriBuilder = new URIBuilder(msaConfigProp.getTwoThConnBaseUrl());
			uriBuilder.setPort(msaConfigProp.getTwoThConnBasePort());
//			URIBuilder uriBuilder = new URIBuilder(baseUrl);
//			uriBuilder.setPort(port);
			uriBuilder.appendPath("/fdt/msaoc/csm");
			uriBuilder.appendPath("/" + reqCmdInfo.getDigitalTwinId());
			uriBuilder.appendPath("/" + "control-results");
			uriBuilder.appendPath("/" + reqCmdInfo.getDigitalObjectId());

			// 단일트윈/2세부 접속 URL
			requestUrl = uriBuilder.toString();

			// 2세부에 전달할 Boby 정보를 생성

			JSONObject bodyJson = new JSONObject();
			JSONObject controlResult = new JSONObject();

			// 테스트 용
			bodyJson.put("reqCtrlCmdIdentifier", reqCmdInfo.getRespIdentifier());

			controlResult.put("execResultCode", map.get("execResultCode"));
			controlResult.put("execResultValue", map.get("execResultValue"));
			controlResult.put("execResultMsg", map.get("execResultMsg"));

//			if("200".equals(map.get("execResultCode"))) {
//				controlResult.put("execResultCode", map.get("execResultCode"));	
//				controlResult.put("execResultValue", map.get("execResultValue"));
//				controlResult.put("execResultMsg", map.get("execResultMsg"));
//			} else {
//				controlResult.put("status_code", "FAIL");
//			}

			bodyJson.put("controlResult", controlResult.toJSONString());

			HttpPost httpPost = new HttpPost(requestUrl);
			httpPost.addHeader("User-Agent", "Mozila/5.0");
			httpPost.addHeader("Content-Type", "application/json");
			httpPost.addHeader("Accept", "application/json");


			StringEntity params = new StringEntity(bodyJson.toJSONString());
			httpPost.setEntity(params);

			logger.info(Thread.currentThread().getName() + " - request URL				: " + requestUrl);

			try {
				try (CloseableHttpResponse response = poolHttpClient.execute(httpPost)) {
					if (response.getCode() < 400) {
						returnBool = true;
					} else {
						returnBool = false;
					}
				}
			} catch (Exception e) {
				logger.error("Error Message : {}", e);
				returnBool = false;
			}
		} catch (Exception e) {
			logger.error("Error Message : {}", e);
			returnBool = false;
		} finally {
//			try {
////				if(returnBool)
//					reqCtrlCmdInfoMapper.deleteDigitalTwinRequestCtrlCmd(reqCmdInfo);
//			} catch(Exception e) {
//				e.printStackTrace();
//			}
		}

		return returnBool;
	}

	public void getReqCtrlCmdListAndDeleteCmd(HashMap<String, Object> map) throws Exception {

//		controlResult.put("execResultCode", map.get("execResultCode"));	
//		controlResult.put("execResultValue", map.get("execResultValue"));
//		controlResult.put("execResultMsg", map.get("execResultMsg"));

		List<DigitalTwinRequestCtrlCmdInfo> digitalTwinRequestCtrlCmdList = reqCtrlCmdInfoMapper
				.getDigitalTwinRequestCtrlCmdList(map);
		DigitalTwinRequestCtrlCmdInfo digitalTwinRequestCtrlCmdInfo = new DigitalTwinRequestCtrlCmdInfo();
		ArrayList<Integer> iList = new ArrayList<>();

		if (digitalTwinRequestCtrlCmdList != null && !digitalTwinRequestCtrlCmdList.isEmpty()) {
			for (int i = 0; i < digitalTwinRequestCtrlCmdList.size(); i++) {
				iList.add(digitalTwinRequestCtrlCmdList.get(i).getDgtwReqCtrlCmdId());
			}

			digitalTwinRequestCtrlCmdInfo.setDgtwReqCtrlCmdIdList(iList);
			reqCtrlCmdInfoMapper.deleteDigitalTwinRequestCtrlCmd(digitalTwinRequestCtrlCmdInfo);
		}
	}
}
