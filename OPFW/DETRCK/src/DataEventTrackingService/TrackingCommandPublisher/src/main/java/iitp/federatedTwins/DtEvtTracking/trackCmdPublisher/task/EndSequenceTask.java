package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.task;

import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.net.URIBuilder;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Scope;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.common.abstractclass.ControlCommandSequenceTask;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.HttpTaskService;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.vo.CtrlCmdSeqTaskProcVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.vo.CtrlCmdTaskSendingVO;

@Component
@Scope(value = "prototype")
public class EndSequenceTask extends ControlCommandSequenceTask {

	private final HttpTaskService httpTaskService;

	private final CtrlCmdTaskInfoService ctrlCmdTaskInfoService;

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdSequenceSendingTask.class);

	@Autowired
	@Qualifier("poolHttpClientConnManager")
	private PoolingHttpClientConnectionManager connManager;

	@Autowired
	@Qualifier("scheduleHttpTaskExecutor")
	private ScheduledThreadPoolExecutor interValScheduler;

	public EndSequenceTask(HttpTaskService httpTaskService, CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.httpTaskService = httpTaskService;
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;
	}

	@Override
	public void run() {
		logger.debug("connManager ==> " + connManager.getRoutes().size() + "  :  "
				+ connManager.getTotalStats().getAvailable() + "  :  " + connManager.getTotalStats().getPending());
		logger.info(Thread.currentThread().getName() + " - Start run() ==> " + TASK_PROC_STEP);

		try {
			CtrlCmdSeqTaskProcVO ctrSeqTaskProcInfo = null;
			HashMap<String, Object> pMap = new HashMap<String, Object>();
			pMap.put("trackingProcessId", taskParam.get("trackingProcessId"));
			pMap.put("taskProcessingId", taskParam.get("taskProcessingId"));

			ctrSeqTaskProcInfo = ctrlCmdTaskInfoService.getControlCommandSequenceTaskProcInfo(pMap);

			if ("RUNNING".equals(TASK_PROC_STEP)) {
				if (ctrSeqTaskProcInfo == null) {
					throw new RuntimeException(
							"**************** Error Occured which Failed to retrieve registered MSA data *******************");
				} else {
					TrackingTaskProcessingInfo mtpsi = new TrackingTaskProcessingInfo();
					mtpsi.setTrackingProcessId(ctrSeqTaskProcInfo.getTrackingProcessId());
					mtpsi.setRequestTrackingId(ctrSeqTaskProcInfo.getRequestTrackingId());
					mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_RUNNING);
					mtpsi.setTaskProcessingId(ctrSeqTaskProcInfo.getTaskProcessingId());
					httpTaskService.updateTaskProcessing(mtpsi);

					HashMap<String, Object> seqMap = new HashMap<String, Object>();
					seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_RUNNING);
					seqMap.put("trackingProcessId", ctrSeqTaskProcInfo.getTrackingProcessId());
					seqMap.put("statusResultMsg", "Sequence Task Proc Update Success");

					int proCnt = this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);
				}

				if (Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(ctrSeqTaskProcInfo.getTrackingProcessType())
						|| Constant.CTRL_CMD_SEQUENCE_RUNNING.equals(ctrSeqTaskProcInfo.getTrackingProcessType())) {
					boolean execBool = false;
					int retryCnt = 0;
					while (!execBool && retryCnt++ < Constant.SERVER_RECONNECT_CNT) {
						execBool = executeHttpConnection(ctrSeqTaskProcInfo);
					}

					if (!execBool) {
						TrackingTaskProcessingInfo mtpsi = new TrackingTaskProcessingInfo();
						mtpsi.setTrackingProcessId(ctrSeqTaskProcInfo.getTrackingProcessId());
						mtpsi.setRequestTrackingId(ctrSeqTaskProcInfo.getRequestTrackingId());
						mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_ERROR);
						mtpsi.setTaskProcessingId(ctrSeqTaskProcInfo.getTaskProcessingId());

						httpTaskService.updateTaskProcessing(mtpsi);

						HashMap<String, Object> seqMap = new HashMap<String, Object>();
						seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
						seqMap.put("trackingProcessId", ctrSeqTaskProcInfo.getTrackingProcessId());
						seqMap.put("statusResultMsg",
								"Sequence Task Proc Update Error ==> SendingTask ==> HTTP Connection");
						this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);
					}
				} else {

					if (ctrSeqTaskProcInfo.getTrackingKafkaTopic() == null
							|| "".equals(ctrSeqTaskProcInfo.getTrackingKafkaTopic())) {
						throw new RuntimeException(
								"**************** Error Occured which MsaCtrlCmdSequence hasn't Next Sequence Identifier  *******************");
					}

					HashMap<String, Object> sMap = new HashMap<String, Object>();
					sMap.put("sequenceIdentifier", ctrSeqTaskProcInfo.getTrackingKafkaTopic());

					TrackingProcessInfo nextMsaCtrlCmdSeq = httpTaskService.getControlCommandSequenceInfo(sMap);

					if (nextMsaCtrlCmdSeq == null) {
						throw new RuntimeException(
								"**************** Error Occured which Next MsaCtrlCmdSequence Is Null *******************");
					}
				}

				long nextInterval = ctrSeqTaskProcInfo.getEventOccurredCount();
				if (nextInterval > 0) {
					try {
						logger.debug("*************  Next Interval Start Thread Sleep ==> " + nextInterval);
						TASK_PROC_STEP = "NEXT_INTERVAL_STEP";
						interValScheduler.schedule(this, nextInterval, TimeUnit.MILLISECONDS);
					} catch (RejectedExecutionException ex) {
						logger.error("Error Message : {}" , ex);
						throw new TaskRejectedException(
								"Executor [" + interValScheduler + "] did not accept task: " + this, ex);
					} catch (Exception e) {
						logger.error("Error Message : {}" , e);
					}
				} else {
					executeNextSequenceProc(ctrSeqTaskProcInfo);
				}
			} else {
				executeNextSequenceProc(ctrSeqTaskProcInfo);
			}
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
		}
	}

	@Override
	protected void executeNextSequenceProc(TrackingProcessInfo msaSeqInfo) {
		CtrlCmdSeqTaskProcVO trackingCtrlCmdSeqTaskProc = (CtrlCmdSeqTaskProcVO) msaSeqInfo;
		try {
			TrackingTaskProcessingInfo mtpsi = new TrackingTaskProcessingInfo();
			mtpsi.setTrackingProcessId(trackingCtrlCmdSeqTaskProc.getTrackingProcessId());
			mtpsi.setRequestTrackingId(trackingCtrlCmdSeqTaskProc.getRequestTrackingId());
			mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_COMPLETE);
			mtpsi.setTaskProcessingId(trackingCtrlCmdSeqTaskProc.getTaskProcessingId());

			httpTaskService.updateTaskProcessing(mtpsi);

			if (Constant.CTRL_CMD_SEQUENCE_START.equals(trackingCtrlCmdSeqTaskProc.getTrackingProcessType())
					|| Constant.CTRL_CMD_SEQUENCE_END.equals(trackingCtrlCmdSeqTaskProc.getTrackingProcessType())) {
				HashMap<String, Object> seqMap = new HashMap<String, Object>();
				seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_COMPLETE);
				seqMap.put("trackingProcessId", trackingCtrlCmdSeqTaskProc.getTrackingProcessId());
				seqMap.put("statusResultMsg", "=== Sequence Task Proc Update Success ===");
				this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);

				if (Constant.CTRL_CMD_SEQUENCE_START.equals(trackingCtrlCmdSeqTaskProc.getTrackingProcessType())) {
					HashMap<String, Object> pMap = new HashMap<String, Object>();
					pMap.put("sequenceIdentifier", trackingCtrlCmdSeqTaskProc.getTrackingKafkaTopic());

					TrackingProcessInfo nextMsaCtrlCmdSeq = httpTaskService.getControlCommandSequenceInfo(pMap);

					if (nextMsaCtrlCmdSeq == null) {
						throw new RuntimeException(
								"**************** Error Occured which Next MsaCtrlCmdSequence Is Null *******************");
					}

					pMap.clear();
					pMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
					pMap.put("trackingProcessId", nextMsaCtrlCmdSeq.getTrackingProcessId());
					pMap.put("statusResultMsg", "=== Sequence Task Proc Update Success ===");
					this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(pMap);
				}
			}
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
		}
	}

	protected boolean checkNextStepFilter(TrackingProcessInfo msaSeqInfo) {
		CtrlCmdSeqTaskProcVO trakcingCtrlCmdSeqTaskProc = (CtrlCmdSeqTaskProcVO) msaSeqInfo;
		try {
			if (trakcingCtrlCmdSeqTaskProc.getTrackingKafkaTopic() == null
					|| "".equals(trakcingCtrlCmdSeqTaskProc.getTrackingKafkaTopic())) {
				throw new RuntimeException(
						"**************** Error Occured which MsaCtrlCmdSequence hasn't Next Sequence Identifier  *******************");
			}

			HashMap<String, Object> pMap = new HashMap<String, Object>();
			pMap.put("sequenceIdentifier", trakcingCtrlCmdSeqTaskProc.getTrackingKafkaTopic());

			TrackingProcessInfo nextMsaCtrlCmdSeq = httpTaskService.getControlCommandSequenceInfo(pMap);

			if (nextMsaCtrlCmdSeq == null) {
				throw new RuntimeException(
						"**************** Error Occured which Next MsaCtrlCmdSequence Is Null *******************");
			}

			TrackingTaskProcessingInfo mtpsi = new TrackingTaskProcessingInfo();
			mtpsi.setTrackingProcessId(trakcingCtrlCmdSeqTaskProc.getTrackingProcessId());
			mtpsi.setRequestTrackingId(trakcingCtrlCmdSeqTaskProc.getRequestTrackingId());
			mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_COMPLETE);
			mtpsi.setTaskProcessingId(trakcingCtrlCmdSeqTaskProc.getTaskProcessingId());

			httpTaskService.updateTaskProcessing(mtpsi);

			HashMap<String, Object> seqMap = new HashMap<String, Object>();
			seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_COMPLETE);
			seqMap.put("trackingProcessId", trakcingCtrlCmdSeqTaskProc.getTrackingProcessId());
			seqMap.put("statusResultMsg", "=== Sequence Task Proc Update Success ===");
			this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);

			long nextInterval = trakcingCtrlCmdSeqTaskProc.getEventOccurredCount();

			try {
				TASK_PROC_STEP = "NEXT_INTERVAL_STEP";
				interValScheduler.schedule(this, nextInterval, TimeUnit.MILLISECONDS);
			} catch (RejectedExecutionException ex) {
				logger.error("Error Message : {}" , ex);
				throw new TaskRejectedException("Executor [" + interValScheduler + "] did not accept task: " + this,
						ex);
			} catch (Exception e) {
				logger.error("Error Message : {}" , e);
			}

			seqMap.clear();
			seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
			seqMap.put("trackingProcessId", nextMsaCtrlCmdSeq.getTrackingProcessId());
			seqMap.put("statusResultMsg", "=== Sequence Task Proc Update Success ===");
			this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);

		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
		}

		return true;
	}

	protected boolean executeHttpConnection(TrackingProcessInfo msaSeqInfo) {
		CtrlCmdSeqTaskProcVO trackingCtrlCmdSeqTaskProc = (CtrlCmdSeqTaskProcVO) msaSeqInfo;
		URIBuilder uriBuilder = null;
		String requestUrl = null;
		CtrlCmdTaskSendingVO trackingTaskSendingVo = null;

		String errorStr = "";

		try {
			HttpClientBuilder clientbuilder = HttpClients.custom().setConnectionManager(connManager);

			CloseableHttpClient httpClient = clientbuilder.build();

			uriBuilder = new URIBuilder(Constant.TWO_TH_CONN_BASE_URL);
			uriBuilder.setPort(Constant.TWO_TH_CONN_BASE_PORT);
			uriBuilder.appendPath("/" + "base");
			uriBuilder.appendPath("/" + "federated-twins");
			uriBuilder.appendPath("/" + trackingCtrlCmdSeqTaskProc.getFederatedTwinId());
			uriBuilder.appendPath("/" + "federated_digital_objects");
			uriBuilder.appendPath("/" + trackingCtrlCmdSeqTaskProc.getFederatedDigitalObjectId());
			uriBuilder.appendPath("/" + "control");

			requestUrl = uriBuilder.toString();

			logger.info(Thread.currentThread().getName() + " - taskProcessingId: "
					+ trackingCtrlCmdSeqTaskProc.getTaskProcessingId());
			logger.info(Thread.currentThread().getName() + " - trackingProcessId: "
					+ trackingCtrlCmdSeqTaskProc.getTrackingProcessId());
			logger.info(Thread.currentThread().getName() + " - reqCtrlCmdId: "
					+ trackingCtrlCmdSeqTaskProc.getRequestTrackingId());

			String taskSendingIdentifiier = UUID.randomUUID().toString();

			trackingTaskSendingVo = new CtrlCmdTaskSendingVO();
			trackingTaskSendingVo.setTaskProcessingId(trackingCtrlCmdSeqTaskProc.getTaskProcessingId());
			trackingTaskSendingVo.setTrackingProcessId(trackingCtrlCmdSeqTaskProc.getTrackingProcessId());
			trackingTaskSendingVo.setRequestTrackingId(trackingCtrlCmdSeqTaskProc.getRequestTrackingId());
			trackingTaskSendingVo.setTaskSendingIdentifiier(taskSendingIdentifiier);
			trackingTaskSendingVo.setTaskConnectionUrl(requestUrl);
			trackingTaskSendingVo.setTaskSendingControlCommandParam(trackingCtrlCmdSeqTaskProc.getTrackingKafkaGroup());
			trackingTaskSendingVo.setTaskSendingStatus(Constant.TASK_SENDING_STATUS_REQ);
			trackingTaskSendingVo.setDigitalObjectId(trackingCtrlCmdSeqTaskProc.getDigitalObjectId());

			String bodyCommand = makeFdtObjControlCommand(trackingTaskSendingVo);

			trackingTaskSendingVo.setTaskSendingControlCommand(bodyCommand);

			int count = httpTaskService.insertTaskSending(trackingTaskSendingVo);

			HttpPost httpPost = new HttpPost(requestUrl);
			httpPost.addHeader("User-Agent", "Mozila/5.0");
			httpPost.addHeader("Content-Type", "application/json");
			httpPost.addHeader("Accept", "application/json");

			StringEntity params = new StringEntity(bodyCommand);
			httpPost.setEntity(params);

			logger.info(Thread.currentThread().getName() + " - request URL				: " + requestUrl);
			logger.info(Thread.currentThread().getName() + " - taskSendingIdentifiier	: " + taskSendingIdentifiier);
			logger.info(Thread.currentThread().getName() + " - trackingCommand			: "
					+ trackingCtrlCmdSeqTaskProc.getTrackingCommand());
			logger.info(Thread.currentThread().getName() + " - trackingParam			: "
					+ trackingCtrlCmdSeqTaskProc.getTrackingKafkaGroup());

			httpClient.execute(httpPost, response -> {
				if (response.getCode() < 400) {
					returnBool = true;
				} else {
					returnBool = false;
				}
				statusCode = String.valueOf(response.getCode());
				logger.info(Thread.currentThread().getName() + " - status code: " + statusCode);

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
							statusCode = sb.toString();
						}
					} catch (Exception e) {
						logger.error("Error Message : {} "+ e);
						statusCode = String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value());
					}
				}
				EntityUtils.consume(entity);

				return entity;
			});

		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
			returnBool = false;
			errorStr = e.getMessage().toString();
			statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);
		} finally {
			if (trackingTaskSendingVo != null) {
				int taskSendingId = trackingTaskSendingVo.getTaskSendingId();

				TrackingTaskSendingInfo trackingTaskSendingInfoRes = new TrackingTaskSendingInfo();
				trackingTaskSendingInfoRes.setTaskSendingId(taskSendingId);
				trackingTaskSendingInfoRes.setTaskProcessingId(trackingCtrlCmdSeqTaskProc.getTaskProcessingId());
				trackingTaskSendingInfoRes.setTrackingProcessId(trackingCtrlCmdSeqTaskProc.getTrackingProcessId());
				trackingTaskSendingInfoRes.setRequestTrackingId(trackingCtrlCmdSeqTaskProc.getRequestTrackingId());
				trackingTaskSendingInfoRes.setTaskSendingStatus(Constant.TASK_SENDING_STATUS_RES);
				trackingTaskSendingInfoRes.setTaskReceiveResultMsg(statusCode);
				try {
					int count = httpTaskService.updateTaskSending(trackingTaskSendingInfoRes);
					logger.info(Thread.currentThread().getName() + " - updateTaskSending count: " + count);
				} catch (Exception e) {
					logger.error("Error Message : {}" , e);
				}
			}
		}

		return returnBool;
	}

	private String makeFdtObjControlCommand(CtrlCmdTaskSendingVO trackingTaskSendingVo) throws Exception {
		JSONObject bodyJson = new JSONObject();
		bodyJson.put("taskSendingIdentifiier", trackingTaskSendingVo.getTaskSendingIdentifiier());
		bodyJson.put("controlCommand", trackingTaskSendingVo.getTaskSendingControlCommand());
		bodyJson.put("conditionParam", trackingTaskSendingVo.getTaskSendingControlCommandParam());

		JSONObject cmdJson = new JSONObject();
		cmdJson.put("control_id", trackingTaskSendingVo.getDigitalControlId());
		cmdJson.put("control_message", trackingTaskSendingVo.getTaskSendingControlCommand());

		JSONArray ctrlCommands = new JSONArray();
		ctrlCommands.add(cmdJson);

		JSONObject fdJson = new JSONObject();
		fdJson.put("digital_object_id", trackingTaskSendingVo.getDigitalObjectId());
		fdJson.put("control_commands", ctrlCommands);

		JSONArray fdCtrlMessage = new JSONArray();
		fdCtrlMessage.add(fdJson);

		bodyJson.put("federated_control_creator", "");
		bodyJson.put("sequence_id", trackingTaskSendingVo.getTaskSendingIdentifiier());
		bodyJson.put("federated_digital_object_control_messages", fdCtrlMessage);

		logger.info(bodyJson.toJSONString());

		return bodyJson.toJSONString();
	}
}
