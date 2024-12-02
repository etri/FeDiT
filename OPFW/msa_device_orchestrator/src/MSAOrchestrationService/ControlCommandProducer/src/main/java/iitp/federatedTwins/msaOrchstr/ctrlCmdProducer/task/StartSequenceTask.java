package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task;

import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.ScheduledThreadPoolExecutor;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Scope;
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
 * @파일명 : StartSequenceTask.java	
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @변경이력 : 
 * @description :
 */

@Component
@Scope(value = "prototype")
public class StartSequenceTask extends ControlCommandSequenceTask {

	private final HttpTaskService httpTaskService;

	private final CtrlCmdTaskInfoService ctrlCmdTaskInfoService;

	private final Logger logger = LoggerFactory.getLogger(StartSequenceTask.class);

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


	public StartSequenceTask(HttpTaskService httpTaskService, CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.httpTaskService = httpTaskService;
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;		
	}


	@Override
	public void run() {
		logger.info(Thread.currentThread().getName() + " - StartSequenceTask Start run() ==> "+TASK_PROC_STEP);

		try {
			CtrlCmdSeqTaskProcVO ctrSeqTaskProcInfo = null;
			//실행할 시퀀스 정보를 조회해와서 실행조건에 맞게 실행시킨다.
			HashMap<String, Object> pMap = new HashMap<String, Object>();
			pMap.put("ctrlCmdSequenceId", taskParam.get("ctrlCmdSequenceId"));
			pMap.put("taskProcessingId", taskParam.get("taskProcessingId"));

			ctrSeqTaskProcInfo = ctrlCmdTaskInfoService.getControlCommandSequenceTaskProcInfo(pMap);

			//한개의 시퀀스만 조회되어야 한다.
			if(ctrSeqTaskProcInfo == null ) {
				throw new RuntimeException("**************** StartSequenceTask Error Occured which Failed to retrieve registered MSA data *******************");
			}
			
			if(!Constant.CTRL_CMD_STATUS_COMPLETE.equals(ctrSeqTaskProcInfo.getReqCtrlCmdStatus()) 
				&& !Constant.CTRL_CMD_STATUS_ERROR.equals(ctrSeqTaskProcInfo.getReqCtrlCmdStatus())
				&& !Constant.CTRL_CMD_STATUS_TIMEOUT.equals(ctrSeqTaskProcInfo.getReqCtrlCmdStatus())
				&& !Constant.CTRL_SEQUENCE_STATUS_COMPLETE.equals(ctrSeqTaskProcInfo.getSequenceStatus()) 
				&& !Constant.CTRL_SEQUENCE_STATUS_ERROR.equals(ctrSeqTaskProcInfo.getSequenceStatus())
			) {
			
				if("RUNNING".equals(TASK_PROC_STEP)) {
					//MsaTaskProcessingInfo Running 상태로 업데이트
					MsaTaskProcessingInfo mtpsi = new MsaTaskProcessingInfo();
					mtpsi.setCtrlCmdSequenceId(ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
					mtpsi.setRequestControlCommandId(ctrSeqTaskProcInfo.getRequestControlCommandId());
					mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_RUNNING);
					mtpsi.setTaskProcessingId(ctrSeqTaskProcInfo.getTaskProcessingId());
					httpTaskService.updateTaskProcessing(mtpsi);
					
					//msa_control_command_sequence_info Running 상태로 업데이트
					HashMap<String, Object> seqMap = new HashMap<String, Object>();
					//Thread Pool Execute 하면 시퀀스 정보 Running 상태로 업데이트					
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
					

					//정상처리 후 다음 시퀀스 정보를 확인하고 다음시퀀스 활성화처리
					//실행할 시퀀스 정보를 조회해와서 실행조건에 맞게 실행시킨다.
					if(ctrSeqTaskProcInfo.getNextSequenceIdentifier() == null || "".equals(ctrSeqTaskProcInfo.getNextSequenceIdentifier())) {
						throw new RuntimeException("**************** StartSequenceTask Error Occured which MsaCtrlCmdSequence hasn't Next Sequence Identifier  *******************");
					}

					HashMap<String, Object> sMap = new HashMap<String, Object>();
					sMap.put("sequenceIdentifier", ctrSeqTaskProcInfo.getNextSequenceIdentifier());

					MsaControlCommandSequenceInfo nextMsaCtrlCmdSeq = httpTaskService.getControlCommandSequenceInfo(sMap);

					if(nextMsaCtrlCmdSeq == null) {
						throw new RuntimeException("**************** StartSequenceTask Error Occured which Next MsaCtrlCmdSequence Is Null *******************");
					}

					//다음 시퀀스 정보 준비상태로 업데이트처리 기존은 등록상태 
					//SS00 -> SS01
					pMap.clear();
					pMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
					pMap.put("ctrlCmdSequenceId", String.valueOf(nextMsaCtrlCmdSeq.getCtrlCmdSequenceId()));
					pMap.put("statusResultMsg", "=== Sequence Task Proc Update Success ===");
					this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(pMap);
										
					String routingKey = RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_REQ_CTRL_COMMAND_SEND;
					
					pMap.clear();
					pMap.put("requestControlCommandId", String.valueOf(nextMsaCtrlCmdSeq.getRequestControlCommandId()));
					pMap.put("ctrlCmdSequenceId", String.valueOf(nextMsaCtrlCmdSeq.getCtrlCmdSequenceId()));
					
					
					//정상 네트워크 접속처리 진행
					boolean execBool = false;					
					execBool = sendRabbitMQMessage(ctrSeqTaskProcInfo, routingKey, pMap);
					
					//정상처리가 아니라면 에러에 대한 상태/이력을 처리한다.
					if(!execBool) {
						//실행된 Process Task 정보 업데이트				
						mtpsi = new MsaTaskProcessingInfo();
						mtpsi.setCtrlCmdSequenceId(ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
						mtpsi.setRequestControlCommandId(ctrSeqTaskProcInfo.getRequestControlCommandId());
						mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_ERROR);
						mtpsi.setTaskProcessingId(ctrSeqTaskProcInfo.getTaskProcessingId());

						httpTaskService.updateTaskProcessing(mtpsi);

						//Sending 처리 실패에만 시퀀스 정보 Error 상태로 업데이트, 완료는 다른곳에서 함.(Comsumer에서 함)
						seqMap.clear();
						seqMap.put("requestControlCommandId", ctrSeqTaskProcInfo.getRequestControlCommandId());
						seqMap.put("ctrlCmdSequenceId", ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
						seqMap.put("reqCtrlCmdStatus", Constant.CTRL_CMD_STATUS_ERROR);
						seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
						seqMap.put("statusResultMsg", "Sequence Task Proc Update Error ==> SendingTask ==> HTTP Connection");
						
						this.ctrlCmdTaskInfoService.updateSingleTaskStatusProc(seqMap);
					}
					
					//StartTask에서는 NextInterval을 처리 후 타스크 및 시퀀스 정보를 처리(완료, 오류)로 변경해야 한다.
					TASK_PROC_STEP = "NEXT_INTERVAL_STEP";
										
					executeNextSequenceProc(ctrSeqTaskProcInfo);
				} else {
					executeNextSequenceProc(ctrSeqTaskProcInfo);
				}
				
			}
				
		}catch(Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	protected void executeNextSequenceProc(MsaControlCommandSequenceInfo msaSeqInfo) {
		CtrlCmdSeqTaskProcVO msaCtrlCmdSeqTaskProc = (CtrlCmdSeqTaskProcVO)msaSeqInfo;
		try {			
			//실행된 Process Task 정보 업데이트				
			MsaTaskProcessingInfo mtpsi = new MsaTaskProcessingInfo();
			mtpsi.setCtrlCmdSequenceId(msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId());
			mtpsi.setRequestControlCommandId(msaCtrlCmdSeqTaskProc.getRequestControlCommandId());
			mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_COMPLETE);
			mtpsi.setTaskProcessingId(msaCtrlCmdSeqTaskProc.getTaskProcessingId());

			httpTaskService.updateTaskProcessing(mtpsi);

			//시퀀스 정보 성공 업데이트 
			HashMap<String, Object> seqMap = new HashMap<String, Object>();
			seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_COMPLETE);
			seqMap.put("ctrlCmdSequenceId", msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId());
			seqMap.put("statusResultMsg", "=== Sequence Task Proc Update Success ===");
			this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);			

		} catch (Exception e) {
			logger.error("StartSequenceTask Error Message : {}" , e);
		}	
	}
	
	protected String statusCode;
	//2세부 정보 전송(HTTP) 부분
	protected boolean sendRabbitMQMessage(MsaControlCommandSequenceInfo msaSeqInfo, String routingKey, HashMap<String, Object> ParamData) {
		CtrlCmdSeqTaskProcVO msaCtrlCmdSeqTaskProc = (CtrlCmdSeqTaskProcVO)msaSeqInfo;
		CtrlCmdTaskSendingVO msaTaskSendingVo = null;

		String errorStr = "";

		try {			
			logger.info(Thread.currentThread().getName() + " - StartSequenceTask taskProcessingId: " + msaCtrlCmdSeqTaskProc.getTaskProcessingId());
			logger.info(Thread.currentThread().getName() + " - StartSequenceTask ctrlCmdSequenceId: " + msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId());
			logger.info(Thread.currentThread().getName() + " - StartSequenceTask requestControlCommandId: " + msaCtrlCmdSeqTaskProc.getRequestControlCommandId());

			String taskSendingIdentifier = UUID.randomUUID().toString();

			//전송할 Body 정보를 생성하기 위한 기본정보 셋팅
			msaTaskSendingVo = new CtrlCmdTaskSendingVO();
			msaTaskSendingVo.setTaskProcessingId(msaCtrlCmdSeqTaskProc.getTaskProcessingId());
			msaTaskSendingVo.setCtrlCmdSequenceId(msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId());
			msaTaskSendingVo.setRequestControlCommandId(msaCtrlCmdSeqTaskProc.getRequestControlCommandId());
			msaTaskSendingVo.setTaskSendingIdentifier(taskSendingIdentifier);
			msaTaskSendingVo.setTaskConnectionUrl(routingKey);
			msaTaskSendingVo.setTaskSendingControlCommandParam(msaCtrlCmdSeqTaskProc.getConditionParam());
			msaTaskSendingVo.setTaskSendingStatus(Constant.TASK_SENDING_STATUS_REQ);
			msaTaskSendingVo.setDigitalObjectId(msaCtrlCmdSeqTaskProc.getDigitalObjectId());
			msaTaskSendingVo.setDigitalControlId(msaCtrlCmdSeqTaskProc.getDigitalControlId());

			//2세부에 전송하는 정보 저장
			int count = httpTaskService.insertTaskSending(msaTaskSendingVo);

			logger.info(Thread.currentThread().getName() + " - StartSequenceTask RabbitMQ routingKey	: " + routingKey);
			logger.info(Thread.currentThread().getName() + " - StartSequenceTask taskSendingIdentifier	: " + taskSendingIdentifier);
			logger.info(Thread.currentThread().getName() + " - StartSequenceTask controlCommand			: " + msaCtrlCmdSeqTaskProc.getControlCommand());
			logger.info(Thread.currentThread().getName() + " - StartSequenceTask conditionParam			: " + msaCtrlCmdSeqTaskProc.getConditionParam());


			try {
				JSONObject json = new JSONObject();
				json.put("requestControlCommandId", ParamData.get("requestControlCommandId"));
				json.put("ctrlCmdSequenceId", ParamData.get("ctrlCmdSequenceId"));
				
				rabbitMqComponent.sendMessage(json, routingKey);
				
				returnBool = true;
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
		}

		return returnBool;
	}
	
	protected boolean checkNextStepFilter(MsaControlCommandSequenceInfo msaSeqInfo) {		
		return true;
	}

	protected boolean executeHttpConnection(MsaControlCommandSequenceInfo msaSeqInfo) {
		return true;
	}
}
