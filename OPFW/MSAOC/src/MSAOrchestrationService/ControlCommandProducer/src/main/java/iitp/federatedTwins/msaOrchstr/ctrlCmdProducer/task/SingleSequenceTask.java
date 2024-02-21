package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task;

import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
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

import iitp.federatedTwins.msaOrchstr.common.abstractclass.ControlCommandSequenceTask;
import iitp.federatedTwins.msaOrchstr.common.config.MSAConfigurationProperties;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskSendingInfo;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.HttpTaskService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.vo.CtrlCmdSeqTaskProcVO;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.vo.CtrlCmdTaskSendingVO;

/**
 * @파일명 : SingleSequenceTask.java
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @변경이력 :
 * @description :
 */

@Component
@Scope(value = "prototype")
public class SingleSequenceTask extends ControlCommandSequenceTask {

	private final HttpTaskService httpTaskService;

	private final CtrlCmdTaskInfoService ctrlCmdTaskInfoService;

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdSequenceSendingTask.class);

	@Autowired
	MSAConfigurationProperties msaConfigProp;

	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;

	@Autowired
	@Qualifier("scheduleHttpTaskExecutor")
	private ScheduledThreadPoolExecutor interValScheduler;

	public SingleSequenceTask(HttpTaskService httpTaskService, CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.httpTaskService = httpTaskService;
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;
	}

	@Override
	public void run() {
		logger.info(Thread.currentThread().getName() + " - Start run() ==> " + TASK_PROC_STEP);

		try {
			CtrlCmdSeqTaskProcVO ctrSeqTaskProcInfo = null;
			// 실행할 시퀀스 정보를 조회해와서 실행조건에 맞게 실행시킨다.
			HashMap<String, Object> pMap = new HashMap<String, Object>();
			pMap.put("ctrlCmdSequenceId", taskParam.get("ctrlCmdSequenceId"));
			pMap.put("taskProcessingId", taskParam.get("taskProcessingId"));

			ctrSeqTaskProcInfo = ctrlCmdTaskInfoService.getControlCommandSequenceTaskProcInfo(pMap);

			if ("RUNNING".equals(TASK_PROC_STEP)) {
				// 한개의 시퀀스만 조회되어야 한다.
				if (ctrSeqTaskProcInfo == null) {
					throw new RuntimeException(
							"**************** Error Occured which Failed to retrieve registered MSA data *******************");
				} else {
					// task(MsaTaskProcessingInfo)정보 Running 상태로 업데이트
					MsaTaskProcessingInfo mtpsi = new MsaTaskProcessingInfo();
					mtpsi.setCtrlCmdSequenceId(ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
					mtpsi.setRequestControlCommandId(ctrSeqTaskProcInfo.getRequestControlCommandId());
					mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_RUNNING);
					mtpsi.setTaskProcessingId(ctrSeqTaskProcInfo.getTaskProcessingId());
					httpTaskService.updateTaskProcessing(mtpsi);

					// Sequence 정보가 Thread Pool Execute하면 시퀀스정보를 Running 상태로 업데이트
					HashMap<String, Object> seqMap = new HashMap<String, Object>();
					seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_RUNNING);
					seqMap.put("ctrlCmdSequenceId", ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
					seqMap.put("statusResultMsg", "Sequence Task Proc Update Success");

					int proCnt = this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);
				}

				// 정상 네트워크 접속처리 진행
				boolean execBool = false;
				int retryCnt = 0;
				// 실패 시 CONN_TRY_CNT 횟수만큼 재 실행
				while (!execBool && retryCnt < Constant.SERVER_RECONNECT_CNT) {
					execBool = executeHttpConnection(ctrSeqTaskProcInfo);

					if (execBool) {
						break;
					} else {
						retryCnt++;
					}
				}

				// 실행된 Process Task 정보 업데이트
				MsaTaskProcessingInfo mtpsi = new MsaTaskProcessingInfo();
				mtpsi.setCtrlCmdSequenceId(ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
				mtpsi.setRequestControlCommandId(ctrSeqTaskProcInfo.getRequestControlCommandId());
				mtpsi.setTaskProcessingStatus(
						execBool ? Constant.CTRL_SEQ_TASK_STATUS_COMPLETE : Constant.CTRL_SEQ_TASK_STATUS_ERROR);
				mtpsi.setTaskProcessingId(ctrSeqTaskProcInfo.getTaskProcessingId());

				httpTaskService.updateTaskProcessing(mtpsi);

				// 정상처리가 아니라면 에러에 대한 상태/이력을 처리한다.
				if (!execBool) {
					// Sending 처리 실패에만 시퀀스 정보 Error 상태로 업데이트, 완료는 다른곳에서 함.(Comsumer에서 함)
					HashMap<String, Object> seqMap = new HashMap<String, Object>();
					seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
					seqMap.put("ctrlCmdSequenceId", ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
					seqMap.put("statusResultMsg",
							"Sequence Task Proc Update Error ==> SendingTask ==> HTTP Connection");
					this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);
				}

				// Task에서는 NextInterval을 처리하기 위해서는 결과를 받고 나서야 처리를 할 수 있다.
				// 정보를 보낼때에는 필요없다.
				// Cunsumer에서 정보를 수신후 결과저장 및 완료처리 / 완료상태로 변환

				// next sequence 실행 인터벌이 있으면 인터벌 적용
				long nextInterval = ctrSeqTaskProcInfo.getNextInterval();
				if (nextInterval > 0) {
					try {
						logger.debug("*************  Next Interval Start Thread Sleep ==> " + nextInterval);
						TASK_PROC_STEP = "NEXT_INTERVAL_STEP";
						interValScheduler.schedule(this, nextInterval, TimeUnit.MILLISECONDS);
					} catch (RejectedExecutionException ex) {
						logger.error("Error Message : {}", ex);
						throw new TaskRejectedException(
								"Executor [" + interValScheduler + "] did not accept task: " + this, ex);
					} catch (Exception e) {
						logger.error("Error Message : {}", e);
					}
				} else {
					executeNextSequenceProc(ctrSeqTaskProcInfo);
				}
			} else {
				executeNextSequenceProc(ctrSeqTaskProcInfo);
			}
		} catch (Exception e) {
			logger.error("Error Message : {}", e);
		}
	}

	@Override
	protected void executeNextSequenceProc(MsaControlCommandSequenceInfo msaSeqInfo) {
	}

	protected boolean checkNextStepFilter(MsaControlCommandSequenceInfo msaSeqInfo) {

		return true;
	}

	// 2세부 정보 전송(HTTP) 부분
	protected boolean executeHttpConnection(MsaControlCommandSequenceInfo msaSeqInfo) {
		CtrlCmdSeqTaskProcVO msaCtrlCmdSeqTaskProc = (CtrlCmdSeqTaskProcVO) msaSeqInfo;
		String requestUrl = null;
		CtrlCmdTaskSendingVO msaTaskSendingVo = null;

		String errorStr = "";

		try {
			logger.info(Thread.currentThread().getName() + " - taskProcessingId: "
					+ msaCtrlCmdSeqTaskProc.getTaskProcessingId());
			logger.info(Thread.currentThread().getName() + " - ctrlCmdSequenceId: "
					+ msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId());
			logger.info(Thread.currentThread().getName() + " - requestControlCommandId: "
					+ msaCtrlCmdSeqTaskProc.getRequestControlCommandId());

			String taskSendingIdentifiier = UUID.randomUUID().toString();

			URIBuilder uriBuilder = new URIBuilder(msaConfigProp.getTwoThConnBaseUrl());
			uriBuilder.setPort(msaConfigProp.getTwoThConnBasePort());
			uriBuilder.appendPath("/" + "base");
			uriBuilder.appendPath("/" + "federated-twins");
			uriBuilder.appendPath("/" + msaCtrlCmdSeqTaskProc.getFederatedTwinId());
			uriBuilder.appendPath("/" + "federated_digital_objects");
			uriBuilder.appendPath("/" + msaCtrlCmdSeqTaskProc.getFederatedDigitalObjectId());
			uriBuilder.appendPath("/" + "control");

			requestUrl = uriBuilder.toString();

			// 전송할 Body 정보를 생성하기 위한 기본정보 셋팅
			msaTaskSendingVo = new CtrlCmdTaskSendingVO();
			msaTaskSendingVo.setTaskProcessingId(msaCtrlCmdSeqTaskProc.getTaskProcessingId());
			msaTaskSendingVo.setCtrlCmdSequenceId(msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId());
			msaTaskSendingVo.setRequestControlCommandId(msaCtrlCmdSeqTaskProc.getRequestControlCommandId());
			msaTaskSendingVo.setTaskSendingIdentifiier(taskSendingIdentifiier);
			msaTaskSendingVo.setTaskConnectionUrl(requestUrl);
			msaTaskSendingVo.setTaskSendingControlCommandParam(msaCtrlCmdSeqTaskProc.getConditionParam());
			msaTaskSendingVo.setTaskSendingStatus(Constant.TASK_SENDING_STATUS_REQ);
			msaTaskSendingVo.setDigitalObjectId(msaCtrlCmdSeqTaskProc.getDigitalObjectId());
			msaTaskSendingVo.setDigitalControlId(msaCtrlCmdSeqTaskProc.getDigitalControlId());

			// 2세부에 전달할 Boby 정보를 생성
			String bodyCommand = makeFdtObjControlCommand(msaTaskSendingVo);

			// 전송할 파라메터 정보를 저장하기 위해 셋팅
			msaTaskSendingVo.setTaskSendingControlCommand(bodyCommand);

			// 2세부에 전송하는 정보 저장
			int count = httpTaskService.insertTaskSending(msaTaskSendingVo);

			HttpPost httpPost = new HttpPost(requestUrl);
			httpPost.addHeader("User-Agent", "Mozila/5.0");
			httpPost.addHeader("Content-Type", "application/json");
			httpPost.addHeader("Accept", "application/json");

			StringEntity params = new StringEntity(bodyCommand);
			httpPost.setEntity(params);

			logger.info(Thread.currentThread().getName() + " - request URL				: " + requestUrl);
			logger.info(Thread.currentThread().getName() + " - taskSendingIdentifiier	: " + taskSendingIdentifiier);
			logger.info(Thread.currentThread().getName() + " - controlCommand			: "
					+ msaCtrlCmdSeqTaskProc.getControlCommand());
			logger.info(Thread.currentThread().getName() + " - conditionParam			: "
					+ msaCtrlCmdSeqTaskProc.getConditionParam());

			try {
				try (CloseableHttpResponse response = poolHttpClient.execute(httpPost)) {
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
							logger.error("Error Message : {}", e);
							statusCode = String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value());
						}
					}
					EntityUtils.consume(entity);
				}
			} catch (Exception e) {
				logger.error("Error Message : {}", e);

				returnBool = false;
				errorStr = e.toString();
				statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);
			}
		} catch (Exception e) {
			logger.error("Error Message : {}", e);
			returnBool = false;
			errorStr = e.toString();
			statusCode = errorStr.substring(0, errorStr.length() < 180 ? errorStr.length() : 180);
		} finally {
			if (msaTaskSendingVo != null) {
				int taskSendingId = msaTaskSendingVo.getTaskSendingId();

				MsaTaskSendingInfo msaTaskSendingInfoRes = new MsaTaskSendingInfo();
				msaTaskSendingInfoRes.setTaskSendingId(taskSendingId);
				msaTaskSendingInfoRes.setTaskProcessingId(msaCtrlCmdSeqTaskProc.getTaskProcessingId());
				msaTaskSendingInfoRes.setCtrlCmdSequenceId(msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId());
				msaTaskSendingInfoRes.setRequestControlCommandId(msaCtrlCmdSeqTaskProc.getRequestControlCommandId());
				msaTaskSendingInfoRes.setTaskSendingStatus(Constant.TASK_SENDING_STATUS_RES);
				msaTaskSendingInfoRes.setTaskReceiveResultMsg(statusCode);
				try {
					int count = httpTaskService.updateTaskSending(msaTaskSendingInfoRes);
					logger.info(Thread.currentThread().getName() + " - updateTaskSending count: " + count);
				} catch (Exception e) {
					logger.error("Error Message : {}", e);
				}
			}
		}

		return returnBool;
	}

	private String makeFdtObjControlCommand(CtrlCmdTaskSendingVO msaTaskSendingVo) throws Exception {
		JSONObject bodyJson = new JSONObject();
		// 테스트 용
		bodyJson.put("taskSendingIdentifiier", msaTaskSendingVo.getTaskSendingIdentifiier());
		bodyJson.put("controlCommand", msaTaskSendingVo.getTaskSendingControlCommand());
		bodyJson.put("conditionParam", msaTaskSendingVo.getTaskSendingControlCommandParam());

		//
		JSONObject cmdJson = new JSONObject();
		cmdJson.put("control_id", msaTaskSendingVo.getDigitalControlId());
		cmdJson.put("control_message", msaTaskSendingVo.getTaskSendingControlCommand());

		JSONArray ctrlCommands = new JSONArray();
		ctrlCommands.add(cmdJson);

		JSONObject fdJson = new JSONObject();
		fdJson.put("digital_object_id", msaTaskSendingVo.getDigitalObjectId());
		fdJson.put("control_commands", ctrlCommands);

		JSONArray fdCtrlMessage = new JSONArray();
		fdCtrlMessage.add(fdJson);

		bodyJson.put("federated_control_creator", "");
		bodyJson.put("sequence_id", msaTaskSendingVo.getTaskSendingIdentifiier());
		bodyJson.put("federated_digital_object_control_messages", fdCtrlMessage);

		logger.info("-----------------------------------------------------------------");
		logger.info(bodyJson.toJSONString());
		logger.info("-----------------------------------------------------------------");

		return bodyJson.toJSONString();
	}
}
