package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.controller;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service.DataEventTrackingRequestService;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.vo.TrackingTransmissionVO;


@RestController
@RequestMapping("/fdt/detrck/trg")
public class TraEvnTriggerController {
	private final Logger logger = LoggerFactory.getLogger(TraEvnTriggerController.class);

	@Autowired
	public DataEventTrackingRequestService requestControlCommandService;
	
	@Autowired
	ApplicationContext ctx;

	@Autowired
	@Qualifier("distribTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	@GetMapping("/transmitter/{request_tracking_id}")
	public ResponseEntity<JSONObject> postTransmitter(HttpServletRequest request,
			@PathVariable("request_tracking_id") String requestControlCommandId) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));
		
		TrackingTransmissionVO tran = new TrackingTransmissionVO();
		
		HashMap<String, Object> paramMap = new HashMap<>();
		paramMap.put("requestTrackingId", requestControlCommandId);
		paramMap.put("reqTrckCmdStatus", Constant.CTRL_CMD_STATUS_COMPLETE);
		paramMap.put("reqTrckCmdStatusErr", Constant.CTRL_CMD_STATUS_ERROR);

		String errorStr = "";
		String statusCode = "";
		
		DataEventTrackingRequestInfo msavo = null;
		
		try {
		
			msavo = requestControlCommandService
					.getDataEventTrackingControlTaskInfo(paramMap);
			
			TrackingTransmissionVO mm = new TrackingTransmissionVO();
			mm.setRequestTrackingId(msavo.getRequestTrackingId());
			mm.setResultCallbackUrl(msavo.getResultCallbackUrl());
			mm.setTransmissionResultData(msavo.getReqTrckCmdStatus());
	
			// Body
			List<NameValuePair> nvps = new ArrayList<>();
			nvps.add(new BasicNameValuePair("result_status", msavo.getReqTrckCmdStatus()));
			nvps.add(new BasicNameValuePair("result_time", msavo.getReqTrckCmdTime()));
		
			
			Map<String, String> mapped = nvps.stream().collect(
					Collectors.toMap(NameValuePair::getName, NameValuePair::getValue));
			
			Map<String, Integer> sts = requestControlCommandService.InsertTransmission(mm, mapped);
			
			
			tran.setTransmissionId(sts.get("transmissionId"));
			
			HttpPost httpPost = new HttpPost(msavo.getResultCallbackUrl());

			httpPost.setEntity(new UrlEncodedFormEntity(nvps));
	
			try (CloseableHttpClient httpclient = HttpClients.createDefault()) {
				try (CloseableHttpResponse response = httpclient.execute(httpPost)) {
					logger.debug("getVersion >>>>>>>> "+ response.getVersion()); // HTTP/1.1
					logger.debug("getCode >>>>>>>> " + response.getCode()); // 200
					logger.debug("getReasonPhrase >>>>>>>> " + response.getReasonPhrase()); // OK

					 statusCode = String.valueOf(response.getCode());
					 errorStr = statusCode;
					 
					HttpEntity entity = response.getEntity();
					if (entity != null) {				
						try {
							String responseBody = EntityUtils.toString(entity);
							logger.info(Thread.currentThread().getName() + "- responseBody: " + responseBody);

							if(!"".equals(responseBody)) {
								JSONParser parser = new JSONParser();							
								JSONObject json = (JSONObject) parser.parse(responseBody);

								StringBuilder sb = new StringBuilder();
								sb.append("status : "+json.get("statusCode"));
								sb.append("  |  error : "+json.get("httpStatus"));
								errorStr = sb.toString();								
							}							
						} catch(Exception e) {
							logger.error("Error Message : {}" , e);
							statusCode = String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value());
						}
					}

					String result = EntityUtils.toString(entity);
					
					tran.setHttpCode(statusCode);
					tran.setHttpReasonPhrase(response.getReasonPhrase()); 

					EntityUtils.consume(entity);
					
				}} 
				catch (IOException | ParseException e) {
					tran.setHttpResult(e.toString()); // 에러 내용
					logger.error("Error Message : {}" , e);
					errorStr = e.getMessage().toString();
					statusCode = errorStr.substring(0, errorStr.length()<180?errorStr.length():180);
				} 
				catch (Exception e) {
					tran.setHttpResult(e.toString()); // 에러 내용
					logger.error("Error Message : {}" , e);
					errorStr = e.getMessage().toString();
					statusCode = errorStr.substring(0, errorStr.length()<180?errorStr.length():180);
				} 
			
		} catch (Exception e) {
			tran.setHttpResult(e.toString()); // 에러 내용
			logger.error("Error Message : {}" , e);
			errorStr = e.getMessage().toString();
			statusCode = errorStr.substring(0, errorStr.length()<180?errorStr.length():180);
		}finally {
			TrackingTransmissionVO msa = new TrackingTransmissionVO();
			msa.setRequestTrackingId(msavo.getRequestTrackingId());
			msa.setTransmissionId(tran.getTransmissionId());
			msa.setResultCallbackUrl(msavo.getResultCallbackUrl());
			msa.setReqTrackingCmd(msavo.getReqTrackingCmd());
			msa.setReqTrckCmdStatus(msavo.getReqTrckCmdStatus());
			msa.setTransmissionResultData(msavo.getReqTrckCmdStatus());

			msa.setHttpCode(tran.getHttpCode());
			msa.setHttpResult(errorStr);
			
			try {
				int count = requestControlCommandService.UpdateTransmission(msa);
				if (count < 1)
					throw new Exception("******* process Error *******");
				logger.info(Thread.currentThread().getName() + " - updateTaskSending count: " + count);
			} catch (Exception e) {
				logger.error("Error Message : {}" , e);			}
		}
		
		return new ResponseEntity<>(httpHeaders, Constant.HTTP_OK_STAT);
	}
	
}
