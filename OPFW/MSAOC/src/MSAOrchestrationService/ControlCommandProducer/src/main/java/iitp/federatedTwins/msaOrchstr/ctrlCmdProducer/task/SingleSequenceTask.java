package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task;

import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.ScheduledThreadPoolExecutor;

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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.msaOrchstr.common.abstractclass.ControlCommandSequenceTask;
import iitp.federatedTwins.msaOrchstr.common.config.MSAConfigurationProperties;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskSendingInfo;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.common.util.RabbitMQConstant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.component.RabbitMQComponent;
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

	private final Logger logger = LoggerFactory.getLogger(SingleSequenceTask.class);

	@Autowired
	MSAConfigurationProperties msaConfigProp;
	
	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;
	
	@Autowired
	RabbitMQComponent rabbitMqComponent;

	@Autowired
	@Qualifier("scheduleHttpTaskExecutor")
	private ScheduledThreadPoolExecutor interValScheduler;


	public SingleSequenceTask(HttpTaskService httpTaskService, CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.httpTaskService = httpTaskService;
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;		
	}


	@Override
	public void run() {		
		logger.info(Thread.currentThread().getName() + " - Start run() ==> "+TASK_PROC_STEP);

		try {
			CtrlCmdSeqTaskProcVO ctrSeqTaskProcInfo = null;
			//실행할 시퀀스 정보를 조회해와서 실행조건에 맞게 실행시킨다.
			HashMap<String, Object> pMap = new HashMap<String, Object>();
			pMap.put("ctrlCmdSequenceId", taskParam.get("ctrlCmdSequenceId"));
			pMap.put("taskProcessingId", taskParam.get("taskProcessingId"));

			ctrSeqTaskProcInfo = ctrlCmdTaskInfoService.getControlCommandSequenceTaskProcInfo(pMap);

			//한개의 시퀀스만 조회되어야 한다.
			if(ctrSeqTaskProcInfo == null ) {
				throw new RuntimeException("**************** Error Occured which Failed to retrieve registered MSA data *******************");
			}
			
			
			if(!Constant.CTRL_CMD_STATUS_COMPLETE.equals(ctrSeqTaskProcInfo.getReqCtrlCmdStatus()) 
				&& !Constant.CTRL_CMD_STATUS_ERROR.equals(ctrSeqTaskProcInfo.getReqCtrlCmdStatus())
				&& !Constant.CTRL_CMD_STATUS_TIMEOUT.equals(ctrSeqTaskProcInfo.getReqCtrlCmdStatus())
				&& !Constant.CTRL_SEQUENCE_STATUS_COMPLETE.equals(ctrSeqTaskProcInfo.getSequenceStatus()) 
				&& !Constant.CTRL_SEQUENCE_STATUS_ERROR.equals(ctrSeqTaskProcInfo.getSequenceStatus())
			) {
				
				if("RUNNING".equals(TASK_PROC_STEP)) {				 
					//task(MsaTaskProcessingInfo)정보  Running 상태로 업데이트
					MsaTaskProcessingInfo mtpsi = new MsaTaskProcessingInfo();
					mtpsi.setCtrlCmdSequenceId(ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
					mtpsi.setRequestControlCommandId(ctrSeqTaskProcInfo.getRequestControlCommandId());
					mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_RUNNING);
					mtpsi.setTaskProcessingId(ctrSeqTaskProcInfo.getTaskProcessingId());
					httpTaskService.updateTaskProcessing(mtpsi);

					//Sequence 정보가 Thread Pool Execute하면 시퀀스정보를 Running 상태로 업데이트					
					HashMap<String, Object> seqMap = new HashMap<String, Object>();
					seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_RUNNING); 
					seqMap.put("ctrlCmdSequenceId", ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
					seqMap.put("statusResultMsg", "Sequence Task Proc Update Success");

					int proCnt = this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);
				
					//msa_request_control_command_info Running 상태로 업데이트
					seqMap.clear();
					seqMap.put("requestControlCommandId", ctrSeqTaskProcInfo.getRequestControlCommandId());
					seqMap.put("reqCtrlCmdStatus", Constant.CTRL_CMD_STATUS_SEQ_RUNNING);
					seqMap.put("ctrlCmdSequenceId", ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
					seqMap.put("statusResultMsg", "Sequence Task Proc Update Running ==> Status Change ==> HTTP Connection Before");
				
					this.ctrlCmdTaskInfoService.updateWithHisAndReqCtrlCmdInfo(seqMap);
					
					//정상 네트워크 접속처리 진행
					boolean execBool = false;					
					execBool = executeHttpConnection(ctrSeqTaskProcInfo);
					
					//실행된 Process Task 정보 업데이트				
					mtpsi = new MsaTaskProcessingInfo();
					mtpsi.setCtrlCmdSequenceId(ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
					mtpsi.setRequestControlCommandId(ctrSeqTaskProcInfo.getRequestControlCommandId());
					mtpsi.setTaskProcessingStatus(execBool?Constant.CTRL_SEQ_TASK_STATUS_COMPLETE:Constant.CTRL_SEQ_TASK_STATUS_ERROR);
					mtpsi.setTaskProcessingId(ctrSeqTaskProcInfo.getTaskProcessingId());

					//process update
					httpTaskService.updateTaskProcessing(mtpsi);

					//정상처리가 아니라면 에러에 대한 상태/이력을 처리한다.
					if(!execBool) {
						//시퀀스, 커멘드 동시 업데이트
						seqMap.clear();
						seqMap.put("requestControlCommandId", ctrSeqTaskProcInfo.getRequestControlCommandId());
						seqMap.put("reqCtrlCmdStatus", Constant.CTRL_CMD_STATUS_ERROR);
						seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
						seqMap.put("ctrlCmdSequenceId", ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
						seqMap.put("statusResultMsg", "Sequence Task Proc Update Error ==> SendingTask ==> HTTP Connection");
						
						this.ctrlCmdTaskInfoService.updateSingleTaskStatusProc(seqMap);
					}	
				} else {
					executeNextSequenceProc(ctrSeqTaskProcInfo);
				}	
			}
			
		}catch(Exception e) {
			logger.error("Error Message : {}" , e);
		}
	}


	@Override
	protected void executeNextSequenceProc(MsaControlCommandSequenceInfo msaSeqInfo) {}


	protected boolean checkNextStepFilter(MsaControlCommandSequenceInfo msaSeqInfo) {

		return true;
	}



	//2세부 정보 전송(HTTP) 부분
	protected boolean executeHttpConnection(MsaControlCommandSequenceInfo msaSeqInfo) {
		CtrlCmdSeqTaskProcVO msaCtrlCmdSeqTaskProc = (CtrlCmdSeqTaskProcVO)msaSeqInfo;		
		String requestUrl = null;
		CtrlCmdTaskSendingVO msaTaskSendingVo = null;

		String errorStr = "";

		String taskSendingIdentifier = UUID.randomUUID().toString();
		
		try {
			logger.info(Thread.currentThread().getName() + " - taskProcessingId: " + msaCtrlCmdSeqTaskProc.getTaskProcessingId());
			logger.info(Thread.currentThread().getName() + " - ctrlCmdSequenceId: " + msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId());
			logger.info(Thread.currentThread().getName() + " - requestControlCommandId: " + msaCtrlCmdSeqTaskProc.getRequestControlCommandId());

			
			URIBuilder uriBuilder = new URIBuilder(msaConfigProp.getTwoThConnBaseUrl());
			uriBuilder.setPort(msaConfigProp.getTwoThConnBasePort());
			uriBuilder.appendPath("/" + "fedit");
			uriBuilder.appendPath("/" + "v1");
			uriBuilder.appendPath("/" + "federated-twins");
			uriBuilder.appendPath("/" + msaCtrlCmdSeqTaskProc.getFederatedTwinId());
			uriBuilder.appendPath("/" + "federated_digital_objects");
			uriBuilder.appendPath("/" + msaCtrlCmdSeqTaskProc.getFederatedDigitalObjectId());
			uriBuilder.appendPath("/" + "control");

			requestUrl = uriBuilder.toString();
			
			//전송할 Body 정보를 생성하기 위한 기본정보 셋팅
			msaTaskSendingVo = new CtrlCmdTaskSendingVO();
			msaTaskSendingVo.setTaskProcessingId(msaCtrlCmdSeqTaskProc.getTaskProcessingId());
			msaTaskSendingVo.setCtrlCmdSequenceId(msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId());
			msaTaskSendingVo.setRequestControlCommandId(msaCtrlCmdSeqTaskProc.getRequestControlCommandId());
			msaTaskSendingVo.setTaskSendingIdentifier(taskSendingIdentifier);
			msaTaskSendingVo.setTaskConnectionUrl(requestUrl);
			msaTaskSendingVo.setTaskSendingControlCommandParam(msaCtrlCmdSeqTaskProc.getConditionParam());
			msaTaskSendingVo.setTaskSendingStatus(Constant.TASK_SENDING_STATUS_REQ);
			msaTaskSendingVo.setDigitalObjectId(msaCtrlCmdSeqTaskProc.getDigitalObjectId());
			msaTaskSendingVo.setDigitalControlId(msaCtrlCmdSeqTaskProc.getDigitalControlId());
			msaTaskSendingVo.setControlCommand(msaCtrlCmdSeqTaskProc.getControlCommand());

			//2세부에 전달할 Boby 정보를 생성
			String bodyCommand = makeFdtObjControlCommand(msaTaskSendingVo);

			//전송할 파라메터 정보를 저장하기 위해 셋팅
			msaTaskSendingVo.setTaskSendingControlCommand(bodyCommand);

			//2세부에 전송하는 정보 저장
			int count = httpTaskService.insertTaskSending(msaTaskSendingVo);

			HttpPost httpPost = new HttpPost(requestUrl);
			httpPost.addHeader("User-Agent", "Mozila/5.0");
			httpPost.addHeader("Content-Type", "application/json");
			httpPost.addHeader("Accept", "application/json");

			StringEntity params = new StringEntity(bodyCommand);			
			httpPost.setEntity(params);

			logger.info(Thread.currentThread().getName() + " - request URL				: " + requestUrl);
			logger.info(Thread.currentThread().getName() + " - taskSendingIdentifier	: " + taskSendingIdentifier);
			logger.info(Thread.currentThread().getName() + " - controlCommand			: " + msaCtrlCmdSeqTaskProc.getControlCommand());
			logger.info(Thread.currentThread().getName() + " - conditionParam			: " + msaCtrlCmdSeqTaskProc.getConditionParam());

			try {
				try (CloseableHttpResponse response = poolHttpClient.execute(httpPost)) {
					if(response.getCode() < 400) {
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

							if(!"".equals(responseBody)) {
								JSONParser parser = new JSONParser();							
								JSONObject json = (JSONObject) parser.parse(responseBody);

								StringBuilder sb = new StringBuilder();
								sb.append("status : "+json.get("statusCode"));
								sb.append("  |  error : "+json.get("httpStatus"));
								statusCode = sb.toString();								
							}							
						} catch(Exception e) {
							logger.error("Error Message : {}" , e);
							statusCode = String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value());
						}
					}
					EntityUtils.consume(entity);
				} 				
			} catch (Exception e) {		
				logger.error("Error Message : {}" , e);
				
				returnBool = false;
				errorStr = e.toString();
				statusCode = errorStr.substring(0, errorStr.length()<180?errorStr.length():180);
			} 
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
			returnBool = false;
			errorStr = e.toString();
			statusCode = errorStr.substring(0, errorStr.length()<180?errorStr.length():180);
		} finally {
			if(msaTaskSendingVo != null) {
				if(returnBool) {
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
						logger.error("Error Message : {}" , e);
					}
				}
				//오류가 났을 때에는 컨슈머에서 저장메세지 확인 및 재 전송처리 및 피드백처리등을 처리한다.
				else {
					JSONObject bodyJson = new JSONObject();		
					JSONObject controlResult = new JSONObject();
								
					//테스트 용
					bodyJson.put("reqCtrlCmdIdentifier", taskSendingIdentifier);
					
					controlResult.put("execResultCode", "500");	
					controlResult.put("execResultValue", statusCode);
					controlResult.put("execResultMsg", statusCode);
										
					bodyJson.put("controlResult", controlResult.toJSONString());
										
					//메소드 호출 실시
					rabbitMqComponent.sendMessage(bodyJson, RabbitMQConstant.RABBITMQ_ROUTING_KEY_SUB_RESP_RSSULT_LISTEN);
				}
				
			}
		}

		return returnBool;
	}

	private String makeFdtObjControlCommand(CtrlCmdTaskSendingVO msaTaskSendingVo) throws Exception {
		JSONObject bodyJson = new JSONObject();		
		//테스트 용
		bodyJson.put("federated_digital_object_control_data_id", msaTaskSendingVo.getTaskSendingIdentifier());
		bodyJson.put("control_data_creator", "");
		
		//제어 명령어				
		JSONObject command = new JSONObject();
		command.put("digital_object_id", msaTaskSendingVo.getDigitalObjectId());
		command.put("control_command", msaTaskSendingVo.getControlCommand());

		JSONArray ctrlCommands = new JSONArray();
		ctrlCommands.add(command);
		
		bodyJson.put("commands", ctrlCommands);

		logger.info("-----------------------------------------------------------------");
		logger.info(bodyJson.toJSONString());
		logger.info("-----------------------------------------------------------------");

		return bodyJson.toJSONString();
	}
}
