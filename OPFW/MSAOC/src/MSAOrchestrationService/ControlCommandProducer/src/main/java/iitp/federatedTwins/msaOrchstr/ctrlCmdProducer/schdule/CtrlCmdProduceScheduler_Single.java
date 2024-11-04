package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.schdule;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
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

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.HttpTaskService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task.PostRequestRunnable;

//@Component
public class CtrlCmdProduceScheduler_Single {	
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

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdProduceScheduler_Single.class);

	public CtrlCmdProduceScheduler_Single(HttpTaskService httpTaskService, CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.httpTaskService = httpTaskService;
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;
	}

//	@Scheduled(initialDelay = 0, fixedDelay = 1000)
	public void execCtrlCmdProduceScheduler() throws Exception {
		logger.info("execCtrlCmdProduceScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execCtrlCmdProduceScheduler => Start Time : " + LocalTime.now());

		HashMap<String, Object> map = new HashMap<>();    	
		int taskProcCnt =25;

		try {
			ArrayList<String> sequenceActTypeList = new ArrayList<String>();
			sequenceActTypeList.add(Constant.CTRL_CMD_SEQUENCE_SINGLE);
			sequenceActTypeList.add(Constant.CTRL_CMD_STATUS_CHECKER);
			sequenceActTypeList.add(Constant.CTRL_CMD_SEQUENCE_START);
			map.put("sequenceActTypeList", sequenceActTypeList);

			map.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
			map.put("start", 0);
			map.put("end", 100);

			//처리할 시퀀스 ID 정보를 가지고 온다 일단 100개 단위로 가지고 옴
			List<Integer> procSeqIdList = this.ctrlCmdTaskInfoService.getCtrlCmdSeqIdList(map);

			if(procSeqIdList != null && procSeqIdList.size()>0) {
				Integer[] allSeqList = procSeqIdList.toArray(new Integer[procSeqIdList.size()]);

				logger.info("***************** execCtrlCmdProduceScheduler proc cout ==> "+allSeqList.length);

				//총 처리 카운트 작업(taskProcCnt분할 할꺼기 때문에 taskProcCnt개단위로 묶음 갯수 확인, 나머지 갯수 +1 카운트)
				int taskCnt = procSeqIdList.size()/taskProcCnt+(procSeqIdList.size()%taskProcCnt==0?0:1);
				logger.info("***************** execCtrlCmdProduceScheduler taskCnt cout ==> "+taskCnt);

				Integer[] ppSeqList = null;
				for(int a=0; a<taskCnt; a++) {    				
					//마지막에 나머지 갯수 처리
					if(a == (taskCnt-1)) {    					
						if(procSeqIdList.size()%taskProcCnt==0) {
							ppSeqList = new Integer[taskProcCnt];
							System.arraycopy(allSeqList, a*taskProcCnt, ppSeqList, 0, taskProcCnt);
						}else {
							ppSeqList = new Integer[procSeqIdList.size()%taskProcCnt];
							System.arraycopy(allSeqList, a*taskProcCnt, ppSeqList, 0, procSeqIdList.size()%taskProcCnt);
						}
					} else {
						ppSeqList = new Integer[taskProcCnt];
						System.arraycopy(allSeqList, a*taskProcCnt, ppSeqList, 0, taskProcCnt);
					}

					map.clear();
					map.put("procSeqList", ppSeqList);

					//------------------------------------------------------------------------------------------------------------------------------------------------        			

					try {        				
						//스케줄러에서 처리를 해야할 목록을 넘겨줌. SeqList, SeqStatus 정보로 해당하는 목록을 조회해서 그 목록을 처리해야 함. Status는 WAIT 상태 
						//실행시키고 바로 RUNNING 상태로 바꿔야 함. 
						List<MsaControlCommandSequenceInfo> msaControlCommandSequences = httpTaskService.getControlCommandTaskInfoList(map);

						HashMap<String, Object> procMap = new HashMap<String, Object>();

						for (MsaControlCommandSequenceInfo msaControlCommandSequence : msaControlCommandSequences) {
							String federatedTwinId = msaControlCommandSequence.getFederatedTwinId();
							String federatedDigitalObjectId = msaControlCommandSequence.getFederatedDigitalObjectId();

							String controlCommand = msaControlCommandSequence.getControlCommand();
							String conditionParam = msaControlCommandSequence.getConditionParam();

							// DB insert - MsaTaskProcessingInfo
							int ctrlCmdSequenceId = msaControlCommandSequence.getCtrlCmdSequenceId();
							int requestControlCommandId = msaControlCommandSequence.getRequestControlCommandId();

							//이미 등록되어 있는 준비상태인 정보를 조회, 없으면 등록 있으면 등록하면 안됨. 추후 세션관리에서 처리
							MsaTaskProcessingInfo msaTaskProcessingInfo = new MsaTaskProcessingInfo();
							msaTaskProcessingInfo.setCtrlCmdSequenceId(ctrlCmdSequenceId);
							msaTaskProcessingInfo.setRequestControlCommandId(requestControlCommandId);
							msaTaskProcessingInfo.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_READY);

							procMap.put("ctrlCmdSequenceId", ctrlCmdSequenceId);
							procMap.put("requestControlCommandId", requestControlCommandId);
							procMap.put("taskProcessingStatus", Constant.CTRL_SEQ_TASK_STATUS_READY);
							int chkCnt = httpTaskService.getTaskProcessingCount(procMap);
							if(chkCnt > 0) {
								logger.info("CtrlCmdProduceTask ctrlCmdSequenceId 중복 ==> ", ctrlCmdSequenceId+"   :   "+requestControlCommandId);
								continue;
							}

							int count = httpTaskService.insertTaskProcessing(msaTaskProcessingInfo);


							//시퀀스 정보 Running 상태로 업데이트
							HashMap<String, Object> seqMap = new HashMap<String, Object>();
							seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_WAIT);
							seqMap.put("ctrlCmdSequenceId", ctrlCmdSequenceId);
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

							// Modify 임시 테스트
							int taskProcessingId = msaTaskProcessingInfo.getTaskProcessingId();

							PostRequestRunnable post = ctx.getBean(PostRequestRunnable.class);

							HashMap<String, Object> postMap = new HashMap<>();    	

							postMap.put("httpClient", httpClient);	
							postMap.put("requestUrl", requestUrl);
							postMap.put("controlCommand", controlCommand);
							postMap.put("conditionParam", conditionParam);
							postMap.put("taskProcessingId", taskProcessingId);
							postMap.put("ctrlCmdSequenceId", ctrlCmdSequenceId);
							postMap.put("requestControlCommandId", requestControlCommandId);

							post.setParameter(postMap);


							logger.debug("===============  처리 id  ==>  "+ctrlCmdSequenceId);
							executor.execute(post);
						}

					} catch (Exception e) {
						e.printStackTrace();
					}

					logger.debug("distribute ==> "+executor.getActiveCount()+"  :  "+executor.getPoolSize());
					logger.debug("httpExecutor ==> "+httpExecutor.getActiveCount()+"  :  "+httpExecutor.getPoolSize());					
        			
				}    			
			} else {
				logger.info("************ execCtrlCmdProduceScheduler checking not running process ************** ");
			}  

			logger.debug("distribute ==> "+executor.getActiveCount()+"  :  "+executor.getPoolSize());
			logger.debug("httpExecutor ==> "+httpExecutor.getActiveCount()+"  :  "+httpExecutor.getPoolSize());
			
		} catch(Exception e) {
			e.printStackTrace();
		}  

		logger.info("execCtrlCmdProduceScheduler => End Time : " + LocalTime.now());
	}
}
