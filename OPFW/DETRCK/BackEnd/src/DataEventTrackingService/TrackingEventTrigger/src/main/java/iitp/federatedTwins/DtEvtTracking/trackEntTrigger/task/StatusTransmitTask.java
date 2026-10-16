package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.task;

import java.util.HashMap;
import java.util.List;

import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusTransmissionInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.DataEventTrackingRequestInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingStatusTransmissionInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;

@Component
@Scope(value = "prototype")
public class StatusTransmitTask implements Runnable {

	private final Logger logger = LoggerFactory.getLogger(StatusTransmitTask.class);

	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;

	@Autowired
	private DataEventTrackingRequestInfoMapper dataEventTrackingRequestInfoMapper;

	@Autowired
	private TrackingProcessInfoMapper trackingProcessInfoMapper;

	@Autowired
	private TrackingStatusTransmissionInfoMapper trackingStatusTransmissionInfoMapper;

	private JSONObject message;

	public void setMessage(JSONObject message) {
		this.message = message;
	}

	@Override
	@SuppressWarnings("unchecked")
	public void run() {
		String url = null;
		String bodyText = null;
		String respCode = null;
		String respMsg = null;
		boolean success = false;
		try {
			HashMap<String, Object> map = new HashMap<>();
			map.put("requestTrackingId", String.valueOf(message.get("requestTrackingId")));
			map.put("trackingProcessId", String.valueOf(message.get("trackingProcessId")));

			DataEventTrackingRequestInfo requestInfo = dataEventTrackingRequestInfoMapper
					.getDataEventTrackingRequestInfo(map);
			TrackingProcessInfo processInfo = trackingProcessInfoMapper.getTrackingProcessInfo(map);
			if (requestInfo == null || processInfo == null) {
				logger.warn("status message skipped. request or process not found. {}", message);
				return;
			}
			url = requestInfo.getResultCallbackUrl();

			JSONObject body = new JSONObject();
			body.put("reqIdentifier", requestInfo.getReqIdentifier());
			body.put("trckTp", processInfo.getTrackingProcessType());
			body.put("trckPrcIdtifier", processInfo.getTrckPrcIdtifier());
			body.put("msgType", Constant.CALLBACK_MSG_TYPE_STATUS);
			body.put("status", message.get("status"));
			if (message.get("lastObservedAt") != null) {
				body.put("lastObservedAt", message.get("lastObservedAt"));
			}
			if (message.get("noDataRefs") instanceof List) {
				JSONArray refs = new JSONArray();
				refs.addAll((List<Object>) message.get("noDataRefs"));
				body.put("noDataRefs", refs);
			}
			body.put("checkedTime", message.get("checkedTime"));
			bodyText = body.toJSONString();

			HttpPost httpPost = new HttpPost(url);
			httpPost.addHeader("User-Agent", "Mozila/5.0");
			httpPost.addHeader("Accept", "application/json");
			httpPost.setEntity(new StringEntity(bodyText, ContentType.APPLICATION_JSON));

			try (CloseableHttpResponse response = poolHttpClient.execute(httpPost)) {
				EntityUtils.consume(response.getEntity());
				respCode = String.valueOf(response.getCode());
				success = response.getCode() >= 200 && response.getCode() < 300;
				logger.info("status message sent. code={} url={} body={}", response.getCode(), url, bodyText);
			}
		} catch (Exception e) {
			respCode = summary(e);
			respMsg = e.toString();
			logger.error("status message send failed. url={} message={}", url, message, e);
		} finally {
			if (url != null) {
				saveHistory(url, bodyText, success, respCode, respMsg);
			}
		}
	}

	@SuppressWarnings("unchecked")
	private void saveHistory(String url, String bodyText, boolean success, String respCode, String respMsg) {
		try {
			TrackingStatusTransmissionInfo info = new TrackingStatusTransmissionInfo();
			info.setRequestTrackingId(Integer.parseInt(String.valueOf(message.get("requestTrackingId"))));
			info.setTrackingProcessId(Integer.parseInt(String.valueOf(message.get("trackingProcessId"))));
			info.setMsgStatus(String.valueOf(message.get("status")));
			info.setLastObservedAt(message.get("lastObservedAt") != null ? String.valueOf(message.get("lastObservedAt")) : null);
			if (message.get("noDataRefs") instanceof List) {
				JSONArray refs = new JSONArray();
				refs.addAll((List<Object>) message.get("noDataRefs"));
				info.setNoDataRefs(refs.toJSONString());
			}
			info.setCheckedTime(message.get("checkedTime") != null ? String.valueOf(message.get("checkedTime")) : null);
			info.setTransmissionStatus(success ? Constant.TRG_EVT_STATUS_COMPLETE : Constant.TRG_EVT_STATUS_ERROR);
			info.setTransmissionUrl(url);
			info.setTransmissionParam(bodyText);
			info.setTransmissionRespCode(respCode);
			info.setTransmissionRespMsg(respMsg);
			trackingStatusTransmissionInfoMapper.insertStatusTransmission(info);
		} catch (Exception e) {
			logger.error("status message history save failed. message={}", message, e);
		}
	}

	private static String summary(Exception e) {
		String s = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
		return s.length() > 180 ? s.substring(0, 180) : s;
	}
}
