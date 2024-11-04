package iitp.fedit.apiGateway.ctrlCmdProc.service.impl;

import java.util.HashMap;

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
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.fedit.apiGateway.common.dto.CtrlCmdExecCodeInfo;
import iitp.fedit.apiGateway.common.dto.CtrlDeviceInfo;
import iitp.fedit.apiGateway.common.dto.CtrlDeviceRoutingServiceInfo;
import iitp.fedit.apiGateway.common.dto.DigitalTwinExecCtrlCmdInfo;
import iitp.fedit.apiGateway.common.dto.DigitalTwinRequestCtrlCmdInfo;
import iitp.fedit.apiGateway.common.mapper.CtrlCmdExecCodeInfoMapper;
import iitp.fedit.apiGateway.common.mapper.CtrlDeviceInfoMapper;
import iitp.fedit.apiGateway.common.mapper.CtrlDeviceRoutingServiceInfoMapper;
import iitp.fedit.apiGateway.common.mapper.DigitalTwinExecCtrlCmdInfoMapper;
import iitp.fedit.apiGateway.common.mapper.DigitalTwinRequestCtrlCmdInfoMapper;
import iitp.fedit.apiGateway.common.util.RabbitMQConstant;
import iitp.fedit.apiGateway.ctrlCmdProc.component.RabbitMQComponent;
import iitp.fedit.apiGateway.ctrlCmdProc.service.CtrlCmdExecService;

@Service
public class CtrlCmdExecServiceImpl implements CtrlCmdExecService {

	@Autowired
	ApplicationContext ctx;

	@Autowired
	@Qualifier("distribTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	@Autowired
	CtrlDeviceInfoMapper ctrlDeviceInfoMapper;

	@Autowired
	DigitalTwinRequestCtrlCmdInfoMapper reqCtrlCmdInfoMapper;

	@Autowired
	DigitalTwinExecCtrlCmdInfoMapper reqCtrlCmdExecMapper;

	@Autowired
	CtrlDeviceRoutingServiceInfoMapper deviceRoutingMapper;

	@Autowired
	CtrlCmdExecCodeInfoMapper codeInfoMapper;

	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdExecServiceImpl.class);

	public CtrlCmdExecServiceImpl() {
	}

	public void executeTaskProc(HashMap<String, Object> map, RabbitMQComponent rabbitMqComponent) throws Exception {

		HashMap<String, Object> pMap = new HashMap<>();
		String status = "500", rstMsg = "";
		JSONObject json = new JSONObject();

		int dgtwReqCtrlCmdId = 0, dgtwExecCtrlCmdId = 0;
		try {
			DigitalTwinExecCtrlCmdInfo cmdExecInfo = reqCtrlCmdExecMapper.getDigitalTwinExecCtrlCmdInfo(map);

			if (cmdExecInfo != null) {
				dgtwReqCtrlCmdId = cmdExecInfo.getDgtwReqCtrlCmdId();
				dgtwExecCtrlCmdId = cmdExecInfo.getDgtwExecCtrlCmdId();

				// 요청정보 확인
				DigitalTwinRequestCtrlCmdInfo reqCmdInfo = reqCtrlCmdInfoMapper.getDigitalTwinRequestCtrlCmdInfo(map);

				if (reqCmdInfo != null) {
					pMap.put("digitalTwinId", reqCmdInfo.getDigitalTwinId());
					pMap.put("digitalObjectId", reqCmdInfo.getDigitalObjectId());

					DigitalTwinRequestCtrlCmdInfo reqMinCmdInfo = reqCtrlCmdInfoMapper.getMinRequestCtrlCmdInfo(pMap);

					// 요청정보와 현재 맨처음 실행해야할 요청정보의 정보가 같은지 확인한다.
					// 정보가 다르다면 이미 실행되고 있는 요청이 있기 때문에 이 요청은 실행하지 않는다.
					// 동일한 트윈-오브젝트에 대한 실행은 순차적으로 이루어 지며 요청이 마무리된 시점 즉 트랜스미터에서 결과전송이 이루어지고 실행된 정보를
					// 삭제한 후 실행처리

					if (reqCmdInfo.getDgtwReqCtrlCmdId() != reqMinCmdInfo.getDgtwReqCtrlCmdId()) {

						// 이것은 오류가 아니기때문에 다음에 처리를 할 수 있는 상태로 만들어 줘야 한다.
						status = "00";

						throw new Exception(
								"******** CtrlCmdExecService executeTaskProc Execute Cmd RunTime Ordering Error  ***********");
					}
				}

				// 요청정보를 처리할 장비 확인작업
				pMap.put("digitalTwinId", reqCmdInfo.getDigitalTwinId());
				pMap.put("digitalObjectId", reqCmdInfo.getDigitalObjectId());

				CtrlDeviceInfo deviceInfo = ctrlDeviceInfoMapper.getCtrlDeviceInfo(pMap);
				if (deviceInfo != null) {

					pMap.clear();
					pMap.put("ctrlKindCode", cmdExecInfo.getCtrlKindCode());
					pMap.put("ctrlCmdCode", cmdExecInfo.getExecCmdCode());

					CtrlCmdExecCodeInfo codeInfo = codeInfoMapper.getCtrlCmdExecCodeInfo(pMap);

					if (codeInfo != null) {
						pMap.clear();
						pMap.put("ctrlDeviceId", deviceInfo.getCtrlDeviceId());
						pMap.put("ctrlCmdExecCodeId", codeInfo.getCtrlCmdExecCodeId());

						CtrlDeviceRoutingServiceInfo routingInfo = deviceRoutingMapper
								.getCtrlDeviceRoutingServiceInfo(pMap);

						// 실행할 명령어가 매핑이 되어 있는지 확인하고 있다면 이 명령어를 전송하는 작업을 진행한다.
						if (routingInfo != null) {

							json.put("execCtrlCmdIdentifier", cmdExecInfo.getExecCtrlCmdIdentifier());
							json.put("execCtrlCmd", cmdExecInfo.getDgtwExecCtrlCmd());

							// 3회 재 전송 실패 시 오류처리

							for (int a = 0; a < 3; a++) {
								try {
									if ("MQTT".equals(deviceInfo.getProtocolType())) {
										rabbitMqComponent.sendMessage(json, routingInfo.getRequestRouting());
									} else if ("HTTP".equals(deviceInfo.getProtocolType())) {
										if (!this.executeHttpConnection(routingInfo.getRequestRouting(), json))
											continue;
									} else {
										throw new Exception(
												"******** CtrlCmdExecService executeTaskProc Non Execute Protocol Error  ***********");
									}


									status = "200";
									rstMsg = "API Gateway Exec Ctrl Cmd Success";
									break;
								} catch (Exception e) {
									e.printStackTrace();
									status = "500";
									rstMsg = "API Gateway Exec Ctrl Cmd Error";
								}
							}

							pMap.clear();
							pMap.put("dgtwReqCtrlCmdId", cmdExecInfo.getDgtwReqCtrlCmdId());
							pMap.put("dgtwExecCtrlCmdId", cmdExecInfo.getDgtwExecCtrlCmdId());
							pMap.put("execCmdStatus", status);

							updateDgtwExecCtrlCmdInfo(pMap);
						} else {
							throw new Exception(
									"******** CtrlCmdExecService executeTaskProc Execute Cmd Device MisMatching Error  ***********");
						}
					} else {
						throw new Exception(
								"******** CtrlCmdExecService executeTaskProc Execute Cmd not Exists Error  ***********");
					}
				} else {
					throw new Exception(
							"******** CtrlCmdExecService executeTaskProc Ctrl Device Error ==> Empty Data  ***********");
				}

			} else {
				throw new Exception(
						"******** CtrlCmdExecService executeTaskProc Request Cmd Info Error ==> Empty Data  ***********");
			}
		} catch (Exception e) {
			logger.error("Error message : {}", e);

			if (!"00".equals(status)) {
				status = "500";
			}

			rstMsg = e.getMessage();
		} finally {
			try {
				HashMap<String, Object> param = new HashMap<>();
				param.put("reqCtrlCmdStatus", status);
				param.put("dgtwReqCtrlCmdId", dgtwReqCtrlCmdId);

				updateReqCtrlCmdInfo(param);

			} catch (Exception e) {
				e.printStackTrace();
			}

			// 전송실패이면 트랜스미터에 실패 메세지 전송
			if ("500".equals(status)) {
				json.put("dgtwReqCtrlCmdId", dgtwReqCtrlCmdId);
				json.put("dgtwExecCtrlCmdId", dgtwExecCtrlCmdId);

				json.put("execResultCode", status);
				json.put("execResultValue", status);
				json.put("execResultMsg", rstMsg);



				rabbitMqComponent.sendMessage(json, RabbitMQConstant.APIGATEWAY_RESULT_TRANSMITTER_ROUTING_KEY);
			}
		}
	}

	@Transactional
	private void updateReqCtrlCmdInfo(HashMap<String, Object> map) throws Exception {

		reqCtrlCmdInfoMapper.updateDigitalTwinRequestCtrlCmdByParam(map);
	}

	@Transactional
	private int updateDgtwExecCtrlCmdInfo(HashMap<String, Object> map) throws Exception {

		return reqCtrlCmdExecMapper.updateDigitalTwinExecCtrlCmdByMap(map);
	}

	protected boolean executeHttpConnection(String connUrl, JSONObject bodyJson) throws Exception {
		String requestUrl = null;

		boolean returnBool = false;
		URIBuilder uriBuilder = new URIBuilder(connUrl);

		// 단일트윈/2세부 접속 URL
		requestUrl = uriBuilder.toString();

		HttpPost httpPost = new HttpPost(requestUrl);
		httpPost.addHeader("User-Agent", "Mozila/5.0");
		httpPost.addHeader("Content-Type", "application/json");
		httpPost.addHeader("Accept", "application/json");


		StringEntity params = new StringEntity(bodyJson.toJSONString());
		httpPost.setEntity(params);

		logger.info(Thread.currentThread().getName() + " - request URL				: " + requestUrl);

		try (CloseableHttpResponse response = poolHttpClient.execute(httpPost)) {
			if (response.getCode() < 400) {
				returnBool = true;
			} else {
				returnBool = false;
			}
		}

		return returnBool;
	}
}
