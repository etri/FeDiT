package iitp.federatedTwins.msaOrchstr.rsDtTransmitter.schdule;

import java.io.IOException;
import java.time.LocalTime;
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

import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.service.RequestControlCommandService;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.vo.RequestTransmissionVO;

//@Component
public class ResCmdProduceScheduler {
	@Autowired
	ApplicationContext ctx;

	@Autowired
	@Qualifier("distribTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	private final Logger logger = LoggerFactory.getLogger(ResCmdProduceScheduler.class);
	
	@Autowired
	public RequestControlCommandService requestControlCommandService;

//	@Scheduled(initialDelay = 0, fixedDelay = 100)
	public void execRealTimeDataBulkScheduled_CDS001() throws Exception {
		logger.info("Current Thread : {}", Thread.currentThread().getName());
		logger.info("CDS001 fixedDelay 후 실행 => time : " + LocalTime.now());
		try {

			HashMap<String, Object> paramMap = new HashMap<>();
			paramMap.put("reqCtrlCmdStatus", Constant.CTRL_CMD_STATUS_COMPLETE);
			// 여기가 검색 조건
			
			List<MsaRequestControlCommandInfo> list = requestControlCommandService
					.getMsaRequestControlTaskInfo(paramMap);
			
			// info한개만받게 수정

			if (list != null && !list.isEmpty()) {
				for (int i = 0; i < list.size(); i++) {
					// 포문 안에 있는 것들만 사용
					// 보낼 때 json 형태로 결과랑 날짜 같이 보내기
					HttpPost httpPost = new HttpPost(list.get(i).getResultCallBackUrl());

					try (CloseableHttpClient httpclient = HttpClients.createDefault()) {
						try (CloseableHttpResponse response = httpclient.execute(httpPost)) {
							logger.debug("getVersion : {} " + response.getVersion());
							logger.debug("getCode : {} " + response.getCode());
							logger.debug("getReasonPhrase : {} " + response.getReasonPhrase());

							HttpEntity entity = response.getEntity();
							String result = EntityUtils.toString(entity);

							EntityUtils.consume(entity);

						}
					} catch (IOException | ParseException e) {
						logger.error("Error Message : {} "+ e);
					} finally {
						RequestTransmissionVO msa = new RequestTransmissionVO();
						msa.setRequestControlCommandId(list.get(i).getRequestControlCommandId());
						msa.setResultCallBackUrl(list.get(i).getResultCallBackUrl());
						msa.setReqCtrlCmd(list.get(i).getReqCtrlCmd());
						msa.setReqCtrlCmdStatus(list.get(i).getReqCtrlCmdStatus());
						try {
						//	int count = requestControlCommandService.transmissionProcess(msa);
							//if (count < 1)
								throw new Exception("******* process Error *******");
						//	logger.info(Thread.currentThread().getName() + " - updateTaskSending count: " + count);
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
