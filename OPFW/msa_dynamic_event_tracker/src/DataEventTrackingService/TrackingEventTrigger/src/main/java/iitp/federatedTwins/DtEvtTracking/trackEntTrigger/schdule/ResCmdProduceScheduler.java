package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.schdule;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;

import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.ParseException;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service.impl.TrackingEventTriggerServiceImpl;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.vo.TrackingTransmissionVO;

@Component
public class ResCmdProduceScheduler {
	@Autowired
	ApplicationContext ctx;

	@Autowired
	@Qualifier("httpTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	private final Logger logger = LoggerFactory.getLogger(ResCmdProduceScheduler.class);
//	
	@Autowired
	public TrackingEventTriggerServiceImpl dataEventTrackingRequestService;

//	@Scheduled(initialDelay = 0, fixedDelay = 100)
	public void execResCmdProduceScheduler() throws Exception {
		logger.info("Current Thread : {}", Thread.currentThread().getName());
		try {

			HashMap<String, Object> paramMap = new HashMap<>();
			paramMap.put("reqCtrlCmdStatus", Constant.TRCK_CMD_STATUS_COMPLETE);

			List<DataEventTrackingRequestInfo> list = dataEventTrackingRequestService
					.getTrackingControlTaskInfo(paramMap);

			if (list != null && !list.isEmpty()) {
				for (int i = 0; i < list.size(); i++) {

					HttpPost httpPost = new HttpPost(list.get(i).getResultCallbackUrl());
					httpPost.addHeader("User-Agent", "Mozila/5.0");
					httpPost.addHeader("Content-Type", "application/json");
					httpPost.addHeader("Accept", "application/json");
										
					try (CloseableHttpClient httpclient = HttpClients.createDefault()) {
						try (CloseableHttpResponse response = httpclient.execute(httpPost)) {
							logger.debug("getVersion >>>>>>>>>"+response.getVersion());
							logger.debug("getCode >>>>>>>>>" + response.getCode());
							logger.debug("getReasonPhrase >>>>>>>>>" + response.getReasonPhrase());

							HttpEntity entity = response.getEntity();
							String result = EntityUtils.toString(entity);

							EntityUtils.consume(entity);

						}
					} catch (IOException | ParseException e) {
						logger.error("Error Message : {} "+ e);
					} finally {
						TrackingTransmissionVO trck = new TrackingTransmissionVO();
						trck.setRequestTrackingId(list.get(i).getRequestTrackingId());
						trck.setResultCallbackUrl(list.get(i).getResultCallbackUrl());
						trck.setReqTrackingCmd(list.get(i).getReqTrackingCmd());
						trck.setReqTrckCmdStatus(list.get(i).getReqTrckCmdStatus());
						try {
						} catch (Exception e) {
							logger.error("Error Message : {} "+ e);
						}
					}
				}

			}
		} catch (Exception e) {
			logger.error("Error Message : {} "+ e);
		}
	}

}
