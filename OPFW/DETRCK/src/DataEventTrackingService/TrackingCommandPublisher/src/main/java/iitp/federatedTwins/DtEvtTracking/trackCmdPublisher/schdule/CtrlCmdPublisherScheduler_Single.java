package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.schdule;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.core5.net.URIBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.HttpTaskService;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.task.PostRequestRunnable;

public class CtrlCmdPublisherScheduler_Single {
	@Autowired
	ApplicationContext ctx;

	@Autowired
	@Qualifier("distribTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	@Autowired
	@Qualifier("httpTaskExecutor")
	private ThreadPoolTaskExecutor httpExecutor;

	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient httpClient;

	private final CtrlCmdTaskInfoService ctrlCmdTaskInfoService;

	private final HttpTaskService httpTaskService;

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdPublisherScheduler_Single.class);
	private int schIdx = 0;

	public CtrlCmdPublisherScheduler_Single(HttpTaskService httpTaskService,
			CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.httpTaskService = httpTaskService;
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;
	}

	public void execCtrlCmdProduceScheduler() throws Exception {
		logger.info("execCtrlCmdProduceScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execCtrlCmdProduceScheduler => Start Time : " + LocalTime.now());

		HashMap<String, Object> map = new HashMap<>();

		int taskProcCnt = 25;

		try {
			ArrayList<String> sequenceActTypeList = new ArrayList<String>();
			sequenceActTypeList.add(Constant.CTRL_CMD_SEQUENCE_SINGLE);
			sequenceActTypeList.add(Constant.CTRL_CMD_SEQUENCE_START);
			map.put("sequenceActTypeList", sequenceActTypeList);

			map.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
			map.put("start", 0);
			map.put("end", 100);

			List<Integer> procSeqIdList = this.ctrlCmdTaskInfoService.getCtrlCmdSeqIdList(map);

			if (procSeqIdList != null && procSeqIdList.size() > 0) {
				Integer[] allSeqList = procSeqIdList.toArray(new Integer[procSeqIdList.size()]);

				logger.info("***************** execCtrlCmdProduceScheduler proc cout ==> " + allSeqList.length);

				int taskCnt = procSeqIdList.size() / taskProcCnt + (procSeqIdList.size() % taskProcCnt == 0 ? 0 : 1);
				logger.info("***************** execCtrlCmdProduceScheduler taskCnt cout ==> " + taskCnt);

				Integer[] ppSeqList = null;
				for (int a = 0; a < taskCnt; a++) {
					if (a == (taskCnt - 1)) {
						if (procSeqIdList.size() % taskProcCnt == 0) {
							ppSeqList = new Integer[taskProcCnt];
							System.arraycopy(allSeqList, a * taskProcCnt, ppSeqList, 0, taskProcCnt);
						} else {
							ppSeqList = new Integer[procSeqIdList.size() % taskProcCnt];
							System.arraycopy(allSeqList, a * taskProcCnt, ppSeqList, 0,
									procSeqIdList.size() % taskProcCnt);
						}
					} else {
						ppSeqList = new Integer[taskProcCnt];
						System.arraycopy(allSeqList, a * taskProcCnt, ppSeqList, 0, taskProcCnt);
					}

					map.clear();
					map.put("procSeqList", ppSeqList);

					try {
						List<TrackingProcessInfo> msaControlCommandSequences = httpTaskService
								.getControlCommandTaskInfoList(map);

						HashMap<String, Object> procMap = new HashMap<String, Object>();

						for (TrackingProcessInfo msaControlCommandSequence : msaControlCommandSequences) {
							String federatedTwinId = msaControlCommandSequence.getFederatedTwinId();
							String federatedDigitalObjectId = msaControlCommandSequence.getFederatedDigitalObjectId();

							String controlCommand = msaControlCommandSequence.getTrackingCommand();
							String conditionParam = msaControlCommandSequence.getTrackingKafkaGroup();

							int trackingProcessId = msaControlCommandSequence.getTrackingProcessId();
							int reqCtrlCmdId = msaControlCommandSequence.getRequestTrackingId();

							TrackingTaskProcessingInfo msaTaskProcessingInfo = new TrackingTaskProcessingInfo();
							msaTaskProcessingInfo.setTrackingProcessId(trackingProcessId);
							msaTaskProcessingInfo.setRequestTrackingId(reqCtrlCmdId);
							msaTaskProcessingInfo.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_READY);

							procMap.put("trackingProcessId", trackingProcessId);
							procMap.put("reqCtrlCmdId", reqCtrlCmdId);
							procMap.put("taskProcessingStatus", Constant.CTRL_SEQ_TASK_STATUS_READY);
							int chkCnt = httpTaskService.getTaskProcessingCount(procMap);
							if (chkCnt > 0) {
								logger.info("CtrlCmdProduceTask ctrlCmdSequenceId 중복 ==> ",
										trackingProcessId + "   :   " + reqCtrlCmdId);
								continue;
							}

							int count = httpTaskService.insertTaskProcessing(msaTaskProcessingInfo);

							HashMap<String, Object> seqMap = new HashMap<String, Object>();
							seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_WAIT);
							seqMap.put("trackingProcessId", trackingProcessId);
							int proCnt = this.ctrlCmdTaskInfoService.updateCtrlCmdSeqInfoTaskProc(seqMap);

							String baseUrl = "http://localhost";
							int port = 23499;

							URIBuilder uriBuilder = new URIBuilder(baseUrl);
							uriBuilder.setPort(port);
							uriBuilder.appendPath("/" + "base");
							uriBuilder.appendPath("/" + "federated-twins");
							uriBuilder.appendPath("/" + federatedTwinId);
							uriBuilder.appendPath("/" + "federated_digital_objects");
							uriBuilder.appendPath("/" + federatedDigitalObjectId);
							uriBuilder.appendPath("/" + "control");

							String requestUrl = uriBuilder.toString();

							int taskProcessingId = msaTaskProcessingInfo.getTaskProcessingId();

							PostRequestRunnable post = ctx.getBean(PostRequestRunnable.class);

							HashMap<String, Object> postMap = new HashMap<>();

							postMap.put("httpClient", httpClient);
							postMap.put("requestUrl", requestUrl);
							postMap.put("controlCommand", controlCommand);
							postMap.put("conditionParam", conditionParam);
							postMap.put("taskProcessingId", taskProcessingId);
							postMap.put("trackingProcessId", trackingProcessId);
							postMap.put("reqCtrlCmdId", reqCtrlCmdId);

							post.setParameter(postMap);

							logger.debug("===============  처리 id  ==>  " + trackingProcessId);
							executor.execute(post);
						}

					} catch (Exception e) {
						logger.error("Error Message : {} "+ e);
					}

					logger.debug("distribute ==> " + executor.getActiveCount() + "  :  " + executor.getPoolSize());
					logger.debug(
							"httpExecutor ==> " + httpExecutor.getActiveCount() + "  :  " + httpExecutor.getPoolSize());
				}
			} else {
				logger.info("************ execCtrlCmdProduceScheduler checking not running process ************** ");
			}

			logger.debug("distribute ==> " + executor.getActiveCount() + "  :  " + executor.getPoolSize());
			logger.debug("httpExecutor ==> " + httpExecutor.getActiveCount() + "  :  " + httpExecutor.getPoolSize());
		} catch (Exception e) {
			logger.error("Error Message : {} "+ e);
		}

		logger.info("execCtrlCmdProduceScheduler => End Time : " + LocalTime.now());
	}
}