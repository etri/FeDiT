package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task;

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

import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskSendingInfo;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.HttpTaskService;

//@Component
//@Scope("prototype")
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
	private int requestControlCommandId;

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
		requestControlCommandId = (int) map.get("requestControlCommandId");

		logger.info(Thread.currentThread().getName() + " - taskProcessingId: " + taskProcessingId);
		logger.info(Thread.currentThread().getName() + " - ctrlCmdSequenceId: " + ctrlCmdSequenceId);
		logger.info(Thread.currentThread().getName() + " - requestControlCommandId: " + requestControlCommandId);

		String taskSendingIdentifier = System.currentTimeMillis() + UUID.randomUUID().toString();

		MsaTaskSendingInfo msaTaskSendingInfo = new MsaTaskSendingInfo();
		msaTaskSendingInfo.setTaskProcessingId(taskProcessingId);
		msaTaskSendingInfo.setCtrlCmdSequenceId(ctrlCmdSequenceId);
		msaTaskSendingInfo.setRequestControlCommandId(requestControlCommandId);
		msaTaskSendingInfo.setTaskSendingIdentifier(taskSendingIdentifier);
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

		// Body
		List<NameValuePair> nvps = new ArrayList<>();
		nvps.add(new BasicNameValuePair("taskSendingIdentifier", taskSendingIdentifier));
		nvps.add(new BasicNameValuePair("controlCommand", controlCommand));
		nvps.add(new BasicNameValuePair("conditionParam", conditionParam));
		httpPost.setEntity(new UrlEncodedFormEntity(nvps));

		logger.info(Thread.currentThread().getName() + " - request URL				: " + requestUrl);
		logger.info(Thread.currentThread().getName() + " - taskSendingIdentifier	: " + taskSendingIdentifier);
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
			MsaTaskSendingInfo msaTaskSendingInfoRes = new MsaTaskSendingInfo();
			msaTaskSendingInfoRes.setTaskSendingId(taskSendingId);
			msaTaskSendingInfoRes.setTaskProcessingId(taskProcessingId);
			msaTaskSendingInfoRes.setCtrlCmdSequenceId(ctrlCmdSequenceId);
			msaTaskSendingInfoRes.setRequestControlCommandId(requestControlCommandId);
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
