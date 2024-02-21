package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.task;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.entity.UrlEncodedFormEntity;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.HttpTaskService;



public class PostRequestRunnable implements Runnable {

	private HttpTaskService httpTaskService;

	private final Logger logger = LoggerFactory.getLogger(PostRequestRunnable.class);

	private HashMap<String, Object> map;
	
	private CloseableHttpClient httpClient;
	private String requestUrl;
	private String controlCommand;
	private String conditionParam;
	private int taskProcessingId;
	private int ctrlCmdSequenceId;
	private int reqCtrlCmdId;
	
	private String statusCode;

	@Autowired
	public void setSensorService(HttpTaskService httpTaskService) {
		this.httpTaskService = httpTaskService;
	}

	public void setParameter(HashMap<String, Object> map) {
		this.map = map;
	}

	@Override
	public void run() {
		logger.info(Thread.currentThread().getName() + " - Start run()");

		httpClient = (CloseableHttpClient) map.get("httpClient");	
		requestUrl = (String) map.get("requestUrl");
		controlCommand = (String) map.get("controlCommand");
		conditionParam = (String) map.get("conditionParam");
		taskProcessingId = (int) map.get("taskProcessingId");
		ctrlCmdSequenceId = (int) map.get("ctrlCmdSequenceId");
		reqCtrlCmdId = (int) map.get("reqCtrlCmdId");
		
		logger.info(Thread.currentThread().getName() + " - taskProcessingId: " + taskProcessingId);
		logger.info(Thread.currentThread().getName() + " - ctrlCmdSequenceId: " + ctrlCmdSequenceId);
		logger.info(Thread.currentThread().getName() + " - reqCtrlCmdId: " + reqCtrlCmdId);

		String taskSendingIdentifiier = System.currentTimeMillis() + UUID.randomUUID().toString();
		
		TrackingTaskSendingInfo msaTaskSendingInfo = new TrackingTaskSendingInfo();
		msaTaskSendingInfo.setTaskProcessingId(taskProcessingId);
		msaTaskSendingInfo.setTrackingProcessId(ctrlCmdSequenceId);
		msaTaskSendingInfo.setRequestTrackingId(reqCtrlCmdId);
		msaTaskSendingInfo.setTaskSendingIdentifiier(taskSendingIdentifiier);
		msaTaskSendingInfo.setTaskConnectionUrl(requestUrl);
		msaTaskSendingInfo.setTaskSendingControlCommand(controlCommand);
		msaTaskSendingInfo.setTaskSendingControlCommandParam(conditionParam);
		msaTaskSendingInfo.setTaskSendingStatus(Constant.TASK_SENDING_STATUS_REQ);

		try {
			int count = httpTaskService.insertTaskSending(msaTaskSendingInfo);
			logger.info(Thread.currentThread().getName() + " - insertTaskSending count: " + count);
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
		}
		
		int taskSendingId = msaTaskSendingInfo.getTaskSendingId(); 

		
		
		HttpPost httpPost = new HttpPost(requestUrl);
		
		List<NameValuePair> nvps = new ArrayList<>();
		nvps.add(new BasicNameValuePair("taskSendingIdentifiier", taskSendingIdentifiier));
		nvps.add(new BasicNameValuePair("controlCommand", controlCommand));
		nvps.add(new BasicNameValuePair("conditionParam", conditionParam));
		httpPost.setEntity(new UrlEncodedFormEntity(nvps));

		logger.info(Thread.currentThread().getName() + " - request URL				: " + requestUrl);
		logger.info(Thread.currentThread().getName() + " - taskSendingIdentifiier	: " + taskSendingIdentifiier);
		logger.info(Thread.currentThread().getName() + " - controlCommand			: " + controlCommand);
		logger.info(Thread.currentThread().getName() + " - conditionParam			: " + conditionParam);

		try {
			httpClient.execute(httpPost, response -> {

				statusCode = String.valueOf(response.getCode());
				logger.info(Thread.currentThread().getName() + " - status code: " + statusCode);

				HttpEntity entity = response.getEntity();
				if (entity != null) {
					String responseBody = EntityUtils.toString(entity);
					logger.info(Thread.currentThread().getName() + "- responseBody: " + responseBody);
				}
				EntityUtils.consume(entity);

				return null;
			}
			
					);
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
		} finally {
			TrackingTaskSendingInfo msaTaskSendingInfoRes = new TrackingTaskSendingInfo();
			msaTaskSendingInfoRes.setTaskSendingId(taskSendingId);
			msaTaskSendingInfoRes.setTaskProcessingId(taskProcessingId);
			msaTaskSendingInfoRes.setTrackingProcessId(ctrlCmdSequenceId);
			msaTaskSendingInfoRes.setRequestTrackingId(reqCtrlCmdId);
			msaTaskSendingInfoRes.setTaskSendingStatus(Constant.TASK_SENDING_STATUS_RES);
			msaTaskSendingInfoRes.setTaskReceiveResultMsg(statusCode);		
			try {
				int count = httpTaskService.updateTaskSending(msaTaskSendingInfoRes);
				logger.info(Thread.currentThread().getName() + " - updateTaskSending count: " + count);
			} catch (Exception e) {
				logger.error("Error Message : {}" , e);
			}
			
		}

	}

}
