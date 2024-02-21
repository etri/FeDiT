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
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service.impl.DataEventTrackingRequestServiceImpl;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.vo.TrackingTransmissionVO;

@Component
public class ResCmdProduceScheduler {
	@Autowired
	ApplicationContext ctx;

	@Autowired
	@Qualifier("distribTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	private final Logger logger = LoggerFactory.getLogger(ResCmdProduceScheduler.class);
	@Autowired
	public DataEventTrackingRequestServiceImpl dataEventTrackingRequestService;

	public void execRealTimeDataBulkScheduled_CDS001() throws Exception {
		logger.info("Current Thread : {}", Thread.currentThread().getName());
		try {

			HashMap<String, Object> paramMap = new HashMap<>();
			paramMap.put("reqCtrlCmdStatus", Constant.CTRL_CMD_STATUS_COMPLETE);

			List<DataEventTrackingRequestInfo> list = dataEventTrackingRequestService
					.getTrackingControlTaskInfo(paramMap);

			if (list != null && !list.isEmpty()) {
				for (int i = 0; i < list.size(); i++) {

					HttpPost httpPost = new HttpPost(list.get(i).getResultCallbackUrl());

					try (CloseableHttpClient httpclient = HttpClients.createDefault()) {
						try (CloseableHttpResponse response = httpclient.execute(httpPost)) {

							HttpEntity entity = response.getEntity();
							String result = EntityUtils.toString(entity);

							EntityUtils.consume(entity);

						}
					} catch (IOException | ParseException e) {
						logger.error("Error Message : {} "+ e);
					} finally {
						TrackingTransmissionVO msa = new TrackingTransmissionVO();
						msa.setRequestTrackingId(list.get(i).getRequestTrackingId());
						msa.setResultCallbackUrl(list.get(i).getResultCallbackUrl());
						msa.setReqTrackingCmd(list.get(i).getReqTrackingCmd());
						msa.setReqTrckCmdStatus(list.get(i).getReqTrckCmdStatus());
					}
				}

			}
		} catch (Exception e) {
			logger.error("Error Message : {} "+ e);
		}
	}

}
