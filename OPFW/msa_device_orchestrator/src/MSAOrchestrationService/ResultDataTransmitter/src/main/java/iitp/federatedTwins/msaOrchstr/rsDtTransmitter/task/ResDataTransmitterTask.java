package iitp.federatedTwins.msaOrchstr.rsDtTransmitter.task;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.entity.UrlEncodedFormEntity;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
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
import org.springframework.context.annotation.Scope;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.service.RequestControlCommandService;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.vo.RequestTransmissionVO;

@Component
@Scope(value = "prototype")
public class ResDataTransmitterTask implements Runnable {

	@Autowired
	ApplicationContext ctx;

	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;

	@Autowired
	private RequestControlCommandService requestControlCommandService;

	private HashMap<String, Object> map;

	private final Logger logger = LoggerFactory.getLogger(ResDataTransmitterTask.class);

	public void setParameter(HashMap<String, Object> map) {
		this.map = map;
	}

	@Override
	public void run() {

		String errorStr = "";
		String statusCode = "";
		RequestTransmissionVO tran = new RequestTransmissionVO();
		MsaRequestControlCommandInfo msavo = new MsaRequestControlCommandInfo();

		try {
			logger.info("requestControlCommandId : {}" , this.map.get("requestControlCommandId"));
			msavo = requestControlCommandService.getMsaTransmitterRequestControlTaskInfo(this.map);

			if(msavo == null || msavo.getTransmissionStatus() != null) 
				return;
			
			RequestTransmissionVO mm = new RequestTransmissionVO();
			mm.setRequestControlCommandId(msavo.getRequestControlCommandId());
			mm.setResultCallBackUrl(msavo.getResultCallBackUrl());

			// Body
			List<NameValuePair> nvps = new ArrayList<>();
			nvps.add(new BasicNameValuePair("request_identifier", msavo.getReqIdentifier()));
			nvps.add(new BasicNameValuePair("result_status", msavo.getReqCtrlCmdStatus()));
			nvps.add(new BasicNameValuePair("result_time", msavo.getReqStatusChangeTime()));

			Map<String, String> mapped = nvps.stream()
					.collect(Collectors.toMap(NameValuePair::getName, NameValuePair::getValue));

			mm.setTransmissionResultData(nvps.toString());

			Map<String, Integer> sts = requestControlCommandService.insertTransmission(mm, mapped);

			tran.setTransmissionId(sts.get("transmissionId"));

			// 보낼 때 json 형태로 결과랑 날짜 같이 보내기
			HttpPost httpPost = new HttpPost(msavo.getResultCallBackUrl());

			httpPost.setEntity(new UrlEncodedFormEntity(nvps));

			try {
				try (CloseableHttpResponse response = poolHttpClient.execute(httpPost)) {
					logger.info("Version : {} ", response.getVersion());
					logger.info("Code : {} ", response.getCode());
					logger.info("ReasonPhrase : {} ", response.getReasonPhrase());

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
							logger.error("Error Message : {}", e);
							statusCode = String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value());
							logger.debug("statusCode : {}", statusCode);
						}
					}

					String result = EntityUtils.toString(entity);

					tran.setHttpCode(statusCode);
					tran.setHttpReasonPhrase(response.getReasonPhrase());

					EntityUtils.consume(entity);
				}
			} catch (IOException | ParseException e) {
				tran.setHttpResult(e.toString()); // 에러 내용
				logger.error("Error Message : {}", e);
				errorStr = e.toString();
				statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);
			} catch (Exception e) {
				tran.setHttpResult(e.toString()); // 에러 내용
				logger.error("Error Message : {}", e);
				errorStr = e.toString();
				statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);
			}

		} catch (Exception e) {
			tran.setHttpResult(e.toString()); // 에러 내용
			logger.error("Error Message : {}", e);
			errorStr = e.toString();
			statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);

			logger.debug("errorStr : {} ", errorStr);
			logger.debug("statusCode : {} ", statusCode);
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
				logger.error("Error Message : {}", e);
			}
		}

	}

}
