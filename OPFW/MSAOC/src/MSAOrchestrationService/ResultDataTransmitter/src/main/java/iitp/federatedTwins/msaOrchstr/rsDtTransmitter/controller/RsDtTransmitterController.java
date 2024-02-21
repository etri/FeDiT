package iitp.federatedTwins.msaOrchstr.rsDtTransmitter.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.entity.UrlEncodedFormEntity;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.ParseException;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.service.RequestControlCommandService;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.vo.RequestTransmissionVO;

@RestController
@RequestMapping("/fdt/msaoc/tsm")
public class RsDtTransmitterController {

	private final Logger logger = LoggerFactory.getLogger(RsDtTransmitterController.class);

	@Autowired
	public RequestControlCommandService requestControlCommandService;

	@Autowired
	ApplicationContext ctx;

	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;

	@GetMapping("/transmitter/{request_control_command_id}")
	public ResponseEntity<JSONObject> postTransmitter(HttpServletRequest request,
			@PathVariable("request_control_command_id") String requestControlCommandId) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		RequestTransmissionVO tran = new RequestTransmissionVO();

		logger.info("requestControlCommandId >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + requestControlCommandId);

		HashMap<String, Object> paramMap = new HashMap<>();
		paramMap.put("requestControlCommandId", requestControlCommandId);
		paramMap.put("reqCtrlCmdStatus", Constant.CTRL_CMD_STATUS_COMPLETE);
		paramMap.put("reqCtrlCmdStatusErr", Constant.CTRL_CMD_STATUS_ERROR);

		String errorStr = "";
		String statusCode = "";

		MsaRequestControlCommandInfo msavo = null;

		try {

			msavo = requestControlCommandService.getMsaTransmitterRequestControlTaskInfo(paramMap);

			RequestTransmissionVO mm = new RequestTransmissionVO();
			mm.setRequestControlCommandId(msavo.getRequestControlCommandId());
			mm.setResultCallBackUrl(msavo.getResultCallBackUrl());

			// Body
			List<NameValuePair> nvps = new ArrayList<>();
			nvps.add(new BasicNameValuePair("result_status", msavo.getReqCtrlCmdStatus()));
			nvps.add(new BasicNameValuePair("result_time", msavo.getReqCtrlCmdTime()));

			Map<String, String> mapped = nvps.stream()
					.collect(Collectors.toMap(NameValuePair::getName, NameValuePair::getValue));

			mm.setTransmissionResultData(nvps.toString());

			Map<String, Integer> sts = requestControlCommandService.InsertTransmission(mm, mapped);

			tran.setTransmissionId(sts.get("transmissionId"));

			// 보낼 때 json 형태로 결과랑 날짜 같이 보내기
			HttpPost httpPost = new HttpPost(msavo.getResultCallBackUrl());

			httpPost.setEntity(new UrlEncodedFormEntity(nvps));

			try {
				try (CloseableHttpResponse response = poolHttpClient.execute(httpPost)) {
					logger.debug("getVersion >>>>>>>>>>>>" + response.getVersion());
					logger.debug("getCode >>>>>>>>>>>>" + response.getCode());
					logger.debug("getReasonPhrase >>>>>>>>>>>>" + response.getReasonPhrase());

					statusCode = String.valueOf(response.getCode());
					errorStr = statusCode;

					HttpEntity entity = response.getEntity();
					if (entity != null) {
						try {
							String responseBody = EntityUtils.toString(entity);
							logger.info(Thread.currentThread().getName() + "- responseBody: " + responseBody);

							if (!"".equals(responseBody)) {
								JSONParser parser = new JSONParser();
								JSONObject json = (JSONObject) parser.parse(responseBody);

								StringBuilder sb = new StringBuilder();
								sb.append("status : " + json.get("statusCode"));
								sb.append("  |  error : " + json.get("httpStatus"));
								errorStr = sb.toString();
							}
						} catch (Exception e) {
							logger.error("error Msg >>>>>>>>>>>>>>>>>>>>>>> " + e);
							statusCode = String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value());
							logger.debug("statusCode >>>>>>>>>>>>>>>>>>>>>>>" + statusCode);
						}
					}

					String result = EntityUtils.toString(entity);

					tran.setHttpCode(statusCode);
					tran.setHttpReasonPhrase(response.getReasonPhrase());

					EntityUtils.consume(entity);
				}
			} catch (IOException | ParseException e) {
				tran.setHttpResult(e.toString()); // 에러 내용
				logger.error("error Msg >>>>>>>>>>>>>>>>>>>>>>> " + e);
				errorStr = e.toString();
				statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);
			} catch (Exception e) {
				tran.setHttpResult(e.toString()); // 에러 내용
				logger.error("error Msg >>>>>>>>>>>>>>>>>>>>>>> " + e);
				errorStr = e.toString();
				statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);
			}

		} catch (Exception e) {
			tran.setHttpResult(e.toString()); // 에러 내용
			logger.error("error Msg >>>>>>>>>>>>>>>>>>>>>>> " + e);
			errorStr = e.toString();
			statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);

			logger.debug("err >>>>>>>>>>>" + errorStr);
			logger.debug("sts >>>>>>>>>>>>>>>>>>" + statusCode);
		} finally {
			RequestTransmissionVO msa = new RequestTransmissionVO();
			msa.setRequestControlCommandId(msavo.getRequestControlCommandId());
			msa.setTransmissionId(tran.getTransmissionId());
			msa.setResultCallBackUrl(msavo.getResultCallBackUrl());
			msa.setReqCtrlCmd(msavo.getReqCtrlCmd());
			msa.setReqCtrlCmdStatus(msavo.getReqCtrlCmdStatus());
			msa.setTransmissionResultData(msavo.getReqCtrlCmdStatus());

			msa.setHttpCode(tran.getHttpCode());
			msa.setHttpResult(errorStr);

			try {
				// 업데이트
				int count = requestControlCommandService.UpdateTransmission(msa);
				if (count < 1)
					throw new Exception("******* process Error *******");
				logger.info(Thread.currentThread().getName() + " - updateTaskSending count: " + count);
			} catch (Exception e) {
				logger.debug("final >>>>>>>>>>>>>>>>>>" + e);
				logger.error("error Msg >>>>>>>>>>>>>>>>>>>>>>> " + e);
			}
		}

		return new ResponseEntity<>(httpHeaders, Constant.HTTP_OK_STAT);
	}

}
