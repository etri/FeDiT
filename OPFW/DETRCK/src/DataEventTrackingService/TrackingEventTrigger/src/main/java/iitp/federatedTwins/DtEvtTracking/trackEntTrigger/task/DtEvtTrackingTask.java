package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.task;

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
import org.apache.hc.core5.http.io.entity.StringEntity;
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

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.EventOccuredInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.EventTransmissionResultInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingDetectorProcInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.DataEventTrackingRequestInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.EventOccuredInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.EventTransmissionResultInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingDectorProcInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service.TrackingEventTriggerService;

@Component
@Scope(value = "prototype")
public class DtEvtTrackingTask implements Runnable {

	@Autowired
	ApplicationContext ctx;

	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;

	@Autowired
	public DataEventTrackingRequestInfoMapper dataEventTrackingRequestInfoMapper;

	@Autowired
	public EventTransmissionResultInfoMapper eventTransmissionResultInfoMapper;

	@Autowired
	public TrackingProcessInfoMapper trackingProcessInfoMapper;

	@Autowired
	public EventOccuredInfoMapper eventOccuredInfoMapper;

	@Autowired
	private TrackingDectorProcInfoMapper trackingDectorProcInfoMapper;

	@Autowired
	private TrackingEventTriggerService trackingEventTriggerService;

	private HashMap<String, Object> map;

	private final Logger logger = LoggerFactory.getLogger(DtEvtTrackingTask.class);

	public void setParameter(HashMap<String, Object> map) {
		this.map = map;
	}

	@Override
	public void run() {
		String errorStr = "";
		String statusCode = "";

		EventTransmissionResultInfo eventTransmissionResultInfo = new EventTransmissionResultInfo();
		DataEventTrackingRequestInfo dataEventTrackingRequestInfo = null;

		try {
			dataEventTrackingRequestInfo = dataEventTrackingRequestInfoMapper.getDataEventTrackingRequestInfo(map);

			if (dataEventTrackingRequestInfo == null)
				return;

			TrackingProcessInfo trackingProcessInfo = trackingProcessInfoMapper.getTrackingProcessInfo(map);

			TrackingDetectorProcInfo detetorProcInfo = trackingDectorProcInfoMapper.getTrackingDectorProcInfo(map);
			
			
			EventOccuredInfo eventInfo = eventOccuredInfoMapper.getEventOccuredInfo(map);

			// 보낼 때 json 형태로 결과랑 날짜 같이 보내기
			HttpPost httpPost = new HttpPost(dataEventTrackingRequestInfo.getResultCallbackUrl());
			httpPost.addHeader("User-Agent", "Mozila/5.0");
			httpPost.addHeader("Content-Type", "application/json");
			httpPost.addHeader("Accept", "application/json");
			
			
			JSONObject bodyCommand = new JSONObject();
			bodyCommand.put("reqIdentifier", dataEventTrackingRequestInfo.getReqIdentifier());
			bodyCommand.put("trckTp", trackingProcessInfo.getTrackingProcessType());
			bodyCommand.put("trckPrcIdtifier", trackingProcessInfo.getTrckPrcIdtifier());
			bodyCommand.put("trckValue", detetorProcInfo.getTrackingResultValue());
			bodyCommand.put("evntOccuredTime", eventInfo.getEventOccuredTime());
			
			
			StringEntity params = new StringEntity(bodyCommand.toJSONString());
			httpPost.setEntity(params);
			
			eventTransmissionResultInfo.setTransmissionParam(bodyCommand.toJSONString());
			
			try {
				try (CloseableHttpResponse response = poolHttpClient.execute(httpPost)) {
					logger.debug("getVersion >>>>>>>> " + response.getVersion()); // HTTP/1.1
					logger.debug("getCode >>>>>>>> " + response.getCode()); // 200
					logger.debug("getReasonPhrase >>>>>>>> " + response.getReasonPhrase()); // OK

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
						}
					}

					String result = EntityUtils.toString(entity);
					EntityUtils.consume(entity);

				}
			} catch (IOException | ParseException e) {
				eventTransmissionResultInfo.setTransmissionRespMsg(e.toString()); // 에러 내용
				errorStr = e.getMessage().toString();
				statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);

			} catch (Exception e) {
				eventTransmissionResultInfo.setTransmissionRespMsg(e.toString()); // 에러 내용
				errorStr = e.getMessage().toString();
				statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);
			}
		} catch (Exception e) {
			eventTransmissionResultInfo.setTransmissionRespMsg(e.toString()); // 에러 내용
			logger.error("Error Message : {}", e);
			errorStr = e.getMessage().toString();
			statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);
		} finally {

			eventTransmissionResultInfo.setDetectorProcId(Integer.valueOf((String) map.get("detectorProcId")));
			eventTransmissionResultInfo.setEventTransmissionStatus(Constant.TRG_EVT_STATUS_COMPLETE);
			eventTransmissionResultInfo.setTransmissionTime("occrd");
			eventTransmissionResultInfo.setTransmissionUrl(dataEventTrackingRequestInfo.getResultCallbackUrl());
			eventTransmissionResultInfo.setTransmissionRespCode(statusCode);
			eventTransmissionResultInfo.setRequestTrackingId(Integer.valueOf((String) map.get("requestTrackingId")));
			eventTransmissionResultInfo.setTrackingProcessId(Integer.valueOf((String) map.get("trackingProcessId")));
			eventTransmissionResultInfo.setEventOccuredId(Integer.valueOf((String) map.get("eventOccuredId")));

			try {
				int suc = trackingEventTriggerService.updateEventTransmissionResultInfo(eventTransmissionResultInfo);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}

}
