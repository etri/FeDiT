package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Scope;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.msaOrchstr.common.abstractclass.ControlCommandSequenceTask;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.schdule.CtrlCmdProduceScheduler;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.HttpTaskService;

@Component 
@Scope(value = "prototype")
public class CtrlCmdDistributedTask implements Runnable {
	@Autowired
	ApplicationContext ctx;

	@Autowired
	CtrlCmdProduceScheduler produceScheduler;

	@Autowired
	@Qualifier("scheduleHttpTaskExecutor")
	private ScheduledThreadPoolExecutor interValScheduler;

	@Autowired
	@Qualifier("httpTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	private final HttpTaskService httpTaskService;

	private final CtrlCmdTaskInfoService ctrlCmdTaskInfoService;


	private HashMap<String, Object> map;

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdDistributedTask.class);

	public CtrlCmdDistributedTask(HttpTaskService httpTaskService, CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.httpTaskService = httpTaskService;
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;		
	}

	public void setParameter(HashMap<String, Object> map) {		
		this.map = map;
	}

	@Override
	public void run() {
		try {
			logger.info("CtrlCmdProduceTask Current Thread : {}", Thread.currentThread().getName());
			logger.info("CtrlCmdProduceTask execCtrlCmdProduceScheduler => time : " + LocalTime.now());
			//스케줄러에서 처리를 해야할 목록을 넘겨줌. SeqList, SeqStatus 정보로 해당하는 목록을 조회해서 그 목록을 처리해야 함. Status는 WAIT 상태 
			//실행시키고 바로 RUNNING 상태로 바꿔야 함. 
			logger.debug("CtrlCmdProduceTask setParameter ==> "+this.map);
			List<MsaControlCommandSequenceInfo> msaControlCommandSequences = httpTaskService.getControlCommandTaskInfoList(this.map);

			for (MsaControlCommandSequenceInfo msaControlCommandSequence : msaControlCommandSequences) {			
				try {
					logger.debug("===============  msaControlCommandSequence.getCtrlCmdSequenceId() id  ==>  "+msaControlCommandSequence.getCtrlCmdSequenceId());

					//TaskProcessingInfo 등록
					MsaTaskProcessingInfo msaTaskProcessingInfo = new MsaTaskProcessingInfo();
					msaTaskProcessingInfo.setCtrlCmdSequenceId(msaControlCommandSequence.getCtrlCmdSequenceId());
					msaTaskProcessingInfo.setRequestControlCommandId(msaControlCommandSequence.getRequestControlCommandId());
					msaTaskProcessingInfo.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_READY);

					int count = httpTaskService.insertTaskProcessing(msaTaskProcessingInfo);

					if(count > 0) {
						//시퀀스 실행처리 진행
						executeActTypeSequencialProc(msaControlCommandSequence, msaTaskProcessingInfo);						
					} else {
						//시퀀스 제어명령 생성 이력등록
						throw new RuntimeException("****************  Msa Sequence Task Insert Processing Runtime Error *******************");
					}					
				} catch(Exception e) {
					logger.error("Error Message : {}" , e);

					int ctrlCmdSequenceId = msaControlCommandSequence.getCtrlCmdSequenceId();

					//시퀀스 정보 재처리를위해 CTRL_SEQ_TASK_STATUS_READY 상태로 업데이트					
					HashMap<String, Object> seqMap = new HashMap<String, Object>();
					seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
					seqMap.put("ctrlCmdSequenceId", ctrlCmdSequenceId);
					seqMap.put("statusResultMsg", "Sequence Task Proc Update Error ==> Distribute Task");
			
					this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);
				}
			}

			logger.debug("httpExecutor ==> "+executor.getActiveCount()+"  :  "+executor.getQueueSize());
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
		}
	}

	private void executeActTypeSequencialProc(MsaControlCommandSequenceInfo msaControlCommandSequence, MsaTaskProcessingInfo msaTaskProcessingInfo) {
		// 등록한 Task ProcessingId를 insert를 통해 반환된 msaTaskProcessingInfo객체를 통해 조회
		int taskProcessingId = msaTaskProcessingInfo.getTaskProcessingId();
		//Sequence 정보 설정
		String federatedTwinId = msaControlCommandSequence.getFederatedTwinId();
		String federatedDigitalObjectId = msaControlCommandSequence.getFederatedDigitalObjectId();
		String digitalTwinId = msaControlCommandSequence.getDigitalTwinId();
		String digitalObjectId = msaControlCommandSequence.getDigitalObjectId();
		String digitalControlId = msaControlCommandSequence.getDigitalControlId();
		String controlCommand = msaControlCommandSequence.getControlCommand();
		String conditionParam = msaControlCommandSequence.getConditionParam();
		int ctrlCmdSequenceId = msaControlCommandSequence.getCtrlCmdSequenceId();
		int requestControlCommandId = msaControlCommandSequence.getRequestControlCommandId();

		try {
			logger.debug("===============  msaControlCommandSequence.getCtrlCmdSequenceId() id  ==>  "+msaControlCommandSequence.getCtrlCmdSequenceId());

			HashMap<String, Object> map = new HashMap<>();    	
			map.put("federatedTwinId", federatedTwinId);
			map.put("federatedDigitalObjectId", federatedDigitalObjectId);

			map.put("digitalTwinId", digitalTwinId);
			map.put("digitalObjectId", digitalObjectId);
			map.put("digitalControlId", digitalControlId);

			map.put("controlCommand", controlCommand);
			map.put("conditionParam", conditionParam);
			map.put("taskProcessingId", taskProcessingId);
			map.put("ctrlCmdSequenceId", ctrlCmdSequenceId);
			map.put("requestControlCommandId", requestControlCommandId);


			//실행하는 시퀀스에 맞는 Task 객체에 데이터를 셋팅 및 처리 프로세스 실행 
			ControlCommandSequenceTask ctrlCmdSeqTask = null;

			if(Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(msaControlCommandSequence.getSequenceActType()))
				ctrlCmdSeqTask = ctx.getBean(SingleSequenceTask.class);
			else if(Constant.CTRL_CMD_SEQUENCE_START.equals(msaControlCommandSequence.getSequenceActType()))
				ctrlCmdSeqTask = ctx.getBean(StartSequenceTask.class);
			else if(Constant.CTRL_CMD_SEQUENCE_RUNNING.equals(msaControlCommandSequence.getSequenceActType()))
				ctrlCmdSeqTask = ctx.getBean(RunningSequenceTask.class);
			else if(Constant.CTRL_CMD_SEQUENCE_END.equals(msaControlCommandSequence.getSequenceActType()))
				ctrlCmdSeqTask = ctx.getBean(EndSequenceTask.class);

			ctrlCmdSeqTask.setTaskParameter(map);

			//시작 인터벌이 있을 경우 실행시키는 Thread Pool이 각각 달라져야 한다.
			long strInterval = msaControlCommandSequence.getStartInterval();

			//Thread Pool 실행 시 오류가 발행하면 오류정보 설정
			if(strInterval < 1) {
				executor.execute(ctrlCmdSeqTask);			
			} else {
				interValScheduler.schedule(ctrlCmdSeqTask, strInterval, TimeUnit.MILLISECONDS);
			}

		} catch(Exception e) {
			logger.error("Error Message : {}" , e);
			try {				
				//Thread Pool Execute 하면 시퀀스 정보 Running 상태로 업데이트					
				HashMap<String, Object> seqMap = new HashMap<String, Object>();
				seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
				seqMap.put("ctrlCmdSequenceId", ctrlCmdSequenceId);
				seqMap.put("statusResultMsg", "Sequence Task Proc Update Error ==> Distribute Task ==> SendingTask");

				this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);


				//실행된 Process Task가 있다면 취소
				//이미 등록되어 있는 준비상태인 정보를 조회, 없으면 등록 있으면 등록하면 안됨. 추후 세션관리에서 처리				
				MsaTaskProcessingInfo mtpsi = new MsaTaskProcessingInfo();
				mtpsi.setCtrlCmdSequenceId(ctrlCmdSequenceId);
				mtpsi.setRequestControlCommandId(requestControlCommandId);
				mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_ERROR);
				mtpsi.setTaskProcessingId(taskProcessingId);
				httpTaskService.updateTaskProcessing(mtpsi);

			} catch(Exception ex) {
				logger.error("Error Message : {}" , ex);
			}
		}
	}
}
