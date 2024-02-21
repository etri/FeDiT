package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.impl;

import java.util.HashMap;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.msaOrchstr.common.abstractclass.ControlCommandSequenceTask;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaControlCommandStatusChangeRecordMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaRequestControlCommandInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaTaskProcessingInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.mapper.MsaControlCommandTaskInfoMapper;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.CtrlCmdPrdService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.HttpTaskService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task.RunningSequenceTask;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task.SingleSequenceTask;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task.StartSequenceTask;

@Service
public class CtrlCmdPrdServiceImpl implements CtrlCmdPrdService{	

	@Autowired
	ApplicationContext ctx;
	
	@Autowired
	@Qualifier("distribTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	@Autowired
	@Qualifier("httpTaskExecutor")
	private ThreadPoolTaskExecutor httpExecutor;
	
	@Autowired
	@Qualifier("scheduleHttpTaskExecutor")
	private ScheduledThreadPoolExecutor interValScheduler;

	private final MsaControlCommandTaskInfoMapper taskMapper;	
	private final MsaTaskProcessingInfoMapper msaTaskProcessingInfoMapper;	
	private final HttpTaskService httpTaskService;
	
	private final Logger logger = LoggerFactory.getLogger(CtrlCmdPrdServiceImpl.class);

	public CtrlCmdPrdServiceImpl(MsaControlCommandTaskInfoMapper taskMapper, MsaTaskProcessingInfoMapper msaTaskProcessingInfoMapper, MsaRequestControlCommandInfoMapper reqCtrlCmdMapper, MsaControlCommandStatusChangeRecordMapper CtrlCmdStsChgHisMapper
								, HttpTaskService httpTaskService) {
		this.taskMapper = taskMapper;
		this.msaTaskProcessingInfoMapper = msaTaskProcessingInfoMapper;
		this.httpTaskService = httpTaskService;		
	}
	
	
	public HttpStatus executeTaskProc(HashMap<String, Object> map) throws Exception {
		HttpStatus procStat = Constant.HTTP_SERVER_ERROR_STAT;

		HashMap<String, Object> pMap = null;
		try {

			// 타스크 정보가 정상적으로 등록되면 시퀀스정보, 운용타스크 정보를 기반으로 단위 실행시퀀스를 실행시킨다.
			pMap = insertTaskProc(map);

			//시퀀스 실행처리 진행
			executeActTypeSequencialProc((MsaControlCommandSequenceInfo)pMap.get("msaControlCommandSequences"), (MsaTaskProcessingInfo)pMap.get("msaTaskProcessingInfo"));	
		
			procStat = Constant.HTTP_OK_STAT;	
		} catch(Exception e) {
			logger.error("Error message : {}" , e);
			
			try {
				if(pMap != null && pMap.get("msaControlCommandSequences") != null) {
					MsaControlCommandSequenceInfo mcs = (MsaControlCommandSequenceInfo)pMap.get("msaControlCommandSequences");
					
					//시퀀스 상태를 에러 상태로 업데이트					
					HashMap<String, Object> seqMap = new HashMap<String, Object>();
					seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
					seqMap.put("ctrlCmdSequenceId", mcs.getCtrlCmdSequenceId());
					seqMap.put("statusResultMsg", "Sequence Task Proc Update Error ==> Distribute Task ==> SendingTask");

					this.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);
					
					
					if(pMap != null && pMap.get("msaControlCommandSequences") != null) {
						MsaTaskProcessingInfo mtp = (MsaTaskProcessingInfo)pMap.get("msaTaskProcessingInfo");
						
						//실행된 Process Task가 있다면 취소
						//이미 등록되어 있는 준비상태인 정보를 조회, 없으면 등록 있으면 등록하면 안됨. 추후 세션관리에서 처리				
						MsaTaskProcessingInfo mtpsi = new MsaTaskProcessingInfo();
						mtpsi.setCtrlCmdSequenceId(mcs.getCtrlCmdSequenceId());
						mtpsi.setRequestControlCommandId(mcs.getRequestControlCommandId());
						mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_ERROR);
						mtpsi.setTaskProcessingId(mtp.getTaskProcessingId());
						
						
						msaTaskProcessingInfoMapper.updateTaskProcessing(mtpsi);
					}
				}

			} catch(Exception ex) {
				logger.error("Error message : {}" , ex);
			}
		}

		return procStat;
	}


	/*
	 	1. 실행할 시퀀스정보를 검색하고 정보처리를 위한 상태정보를 변경처리한다.
	 	2. 
	 */
	
	@Transactional(readOnly=false, propagation=Propagation.REQUIRED, rollbackFor=Exception.class)
	public HashMap<String, Object> insertTaskProc(HashMap<String, Object> map) throws Exception {
		MsaTaskProcessingInfo msaTaskProcessingInfo = new MsaTaskProcessingInfo();
		
		HashMap<String, Object> pMap = null;
		HashMap<String, Object> procMap = new HashMap<String, Object>();
		
		logger.info("requestControlCommandId={}" , map.get("requestControlCommandId"));
		logger.info("ctrlCmdSequenceId={}" , map.get("ctrlCmdSequenceId"));
		
		int requestControlCommandId = Integer.parseInt((String)map.get("requestControlCommandId")) ;
		int ctrlCmdSequenceId = Integer.parseInt((String)map.get("ctrlCmdSequenceId"));

		pMap = new HashMap<>();
		//실행대기 상태
		pMap.put("isProcTaskExists", "TASK");
		pMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_WAIT);
		pMap.put("ctrlCmdSequenceId", ctrlCmdSequenceId);
		pMap.put("statusResultMsg", "Sequence Task Proc Update Success");

		//Task 정보에 넘기기 전에 시퀀스정보의 상태, 이력을 업데이트 해준다
		int proCnt = updateWithHisAndCtrlCmdSeqInfoTaskProc(pMap);	
		
		
		MsaControlCommandSequenceInfo msaControlCommandSequences = httpTaskService.getControlCommandSequenceInfo(pMap);
		
		//시퀀스를 처리할 TaskProcessingInfo 등록			
		msaTaskProcessingInfo.setCtrlCmdSequenceId(ctrlCmdSequenceId);
		msaTaskProcessingInfo.setRequestControlCommandId(requestControlCommandId);
		msaTaskProcessingInfo.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_READY);

		int count = httpTaskService.insertTaskProcessing(msaTaskProcessingInfo);

		if(count > 0) {
			procMap.put("msaControlCommandSequences", msaControlCommandSequences);
			procMap.put("msaTaskProcessingInfo", msaTaskProcessingInfo);									
		} else {
			//시퀀스 제어명령 생성 이력등록
			throw new RuntimeException("****************  Msa Sequence Task Insert Processing Runtime Error *******************");
		}	
	
		return procMap;
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
			//Producer에서는 sst, sts, rts 만 실행시키고 2세부에 정보전송 후 consumer에서는 sst, ets를 실행시켜 transmitter 에 처리결과를 전송
			//중간에 에러가 날 경우 상태체크에서 transmitter에 에러정보 확인하여 전송

			if(Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(msaControlCommandSequence.getSequenceActType()))
				ctrlCmdSeqTask = ctx.getBean(SingleSequenceTask.class);
			else if(Constant.CTRL_CMD_SEQUENCE_START.equals(msaControlCommandSequence.getSequenceActType()))
				ctrlCmdSeqTask = ctx.getBean(StartSequenceTask.class);
			else if(Constant.CTRL_CMD_SEQUENCE_RUNNING.equals(msaControlCommandSequence.getSequenceActType()))
				ctrlCmdSeqTask = ctx.getBean(RunningSequenceTask.class);

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
			logger.error("Error message : {}" , e);
			try {				
				//시퀀스 상태를 에러 상태로 업데이트					
				HashMap<String, Object> seqMap = new HashMap<String, Object>();
				seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
				seqMap.put("ctrlCmdSequenceId", ctrlCmdSequenceId);
				seqMap.put("statusResultMsg", "Sequence Task Proc Update Error ==> Distribute Task ==> SendingTask");

				this.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);


				//실행된 Process Task가 있다면 취소
				//이미 등록되어 있는 준비상태인 정보를 조회, 없으면 등록 있으면 등록하면 안됨. 추후 세션관리에서 처리				
				MsaTaskProcessingInfo mtpsi = new MsaTaskProcessingInfo();
				mtpsi.setCtrlCmdSequenceId(ctrlCmdSequenceId);
				mtpsi.setRequestControlCommandId(requestControlCommandId);
				mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_ERROR);
				mtpsi.setTaskProcessingId(taskProcessingId);
				
				
				msaTaskProcessingInfoMapper.updateTaskProcessing(mtpsi);

			} catch(Exception ex) {
				logger.error("Error message : {}" , ex);
			}
			
			//시퀀스 제어명령 생성 이력등록
			throw new RuntimeException("****************  Msa Act Type Sequence Running Processing Runtime Error *******************");
		}
	}
		
	/*
	 	1. 시퀀스 ID에 해당하는 시퀀스 정보를 상태만 변경하는 쿼리
	 	2. 변경된 시퀀스 정보의 이력을 남기는 쿼리
	 */
	@Transactional(readOnly=false, propagation=Propagation.REQUIRED, rollbackFor=Exception.class)
	public int updateWithHisAndCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception {
		//시퀀스 ID에 해당하는 시퀀스 정보를 상태만 변경하는 쿼리
		int proCnt = this.taskMapper.updateCtrlCmdSeqInfoTaskProc(map);

		//상태정보 업데이트되야 이후 프로세스처리를 진행해야 한다.
		if(proCnt > 0) {
			//변경된 시퀀스 정보의 이력을 남기는 쿼리
			this.taskMapper.insertCtrlCmdSeqChangeHisMultiProcInfo(map);			
		}

		return proCnt;
	}

}
