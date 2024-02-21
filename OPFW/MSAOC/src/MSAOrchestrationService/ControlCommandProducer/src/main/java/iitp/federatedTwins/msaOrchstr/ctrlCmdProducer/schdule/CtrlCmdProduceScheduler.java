package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.schdule;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task.CtrlCmdDistributedTask;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task.CtrlCmdSequenceSendingTask;

@Component
public class CtrlCmdProduceScheduler {
	@Autowired
	ApplicationContext ctx;

	@Autowired
	@Qualifier("distribTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	@Autowired
	@Qualifier("httpTaskExecutor")
	private ThreadPoolTaskExecutor httpExecutor;

	private final CtrlCmdTaskInfoService ctrlCmdTaskInfoService;

	private ArrayList<CtrlCmdSequenceSendingTask> taskSeqList = new ArrayList<CtrlCmdSequenceSendingTask>();

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdProduceScheduler.class);

	public CtrlCmdProduceScheduler(CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;
	}

	public void addTaskSeqList(CtrlCmdSequenceSendingTask taskSeq) {
		this.taskSeqList.add(taskSeq);
	}

	public void execCtrlCmdProduceScheduler() throws Exception {
		logger.info("execCtrlCmdProduceScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execCtrlCmdProduceScheduler => Start Time : " + LocalTime.now());

		HashMap<String, Object> map = new HashMap<>();
		int taskProcCnt = 20;

		try {
			ArrayList<String> sequenceActTypeList = new ArrayList<String>();
			sequenceActTypeList.add(Constant.CTRL_CMD_SEQUENCE_SINGLE);
			sequenceActTypeList.add(Constant.CTRL_CMD_SEQUENCE_START);
			map.put("sequenceActTypeList", sequenceActTypeList);

			map.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
			map.put("start", 0);
			map.put("end", 100);

			// 처리할 시퀀스 ID 정보를 가지고 온다 일단 100개 단위로 가지고 옴
			List<Integer> procSeqIdList = this.ctrlCmdTaskInfoService.getCtrlCmdSeqIdList(map);

			if (procSeqIdList != null && procSeqIdList.size() > 0) {
				Integer[] allSeqList = procSeqIdList.toArray(new Integer[procSeqIdList.size()]);

				// 총 처리 카운트 작업(taskProcCnt분할 할꺼기 때문에 taskProcCnt개단위로 묶음 갯수 확인, 나머지 갯수 +1 카운트)
				int taskCnt = procSeqIdList.size() / taskProcCnt + (procSeqIdList.size() % taskProcCnt == 0 ? 0 : 1);

				Integer[] ppSeqList = null;
				HashMap<String, Object> pMap = null;
				for (int a = 0; a < taskCnt; a++) {
					try {
						// 마지막에 나머지 갯수 처리
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

						logger.debug(
								"execCtrlCmdProduceScheduler  deepToString  ==>  " + Arrays.deepToString(ppSeqList));

						pMap = new HashMap<>();
						// 실행대기 상태
						pMap.put("isProcTaskExists", "TASK");
						pMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_WAIT);
						pMap.put("procSeqList", ppSeqList);
						pMap.put("statusResultMsg", "Sequence Task Proc Update Success");

						// Task 정보에 넘기기 전에 처리해야 할 정보를 업데이트 해준다 중복처리 제거를 위해서. 상태는 실행 대기
						int proCnt = this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(pMap);

						// 상태정보 업데이트되야 이후 프로세스처리를 진행해야 한다.
						if (proCnt > 0) {
							CtrlCmdDistributedTask ccp = ctx.getBean(CtrlCmdDistributedTask.class);
							ccp.setParameter(pMap);
							executor.execute(ccp);

							ppSeqList = null;
						} else {
							logger.debug("CTRL_SEQUENCE_STATUS_WAIT UPDATE Count  ==>  0");
						}
					} catch (Exception e) {
						e.printStackTrace();

						if (ppSeqList != null) {
							// 에러 시 다시 실행시기기 위해 대기 상태로 돌려놓는다.
							pMap = new HashMap<>();
							// 실행대기 상태
							pMap.put("isProcTaskExists", "TASK");
							pMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
							pMap.put("procSeqList", ppSeqList);
							pMap.put("statusResultMsg", "Sequence Task Proc Update Error ==> Scheduler");

							// Task 정보에 넘기기 전에 처리해야 할 정보를 업데이트 해준다 중복처리 제거를 위해서. 상태는 실행 대기
							// this.ctrlCmdTaskInfoService.updateCtrlCmdSeqInfoTaskProc(pMap);
							this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(pMap);
						}
					}
					logger.debug("distribute ==> " + executor.getActiveCount() + "  :  " + executor.getQueueSize());
				}
			} else {
				logger.info("************ execCtrlCmdProduceScheduler checking not running process ************** ");
			}
		} catch (Exception e) {
			e.printStackTrace();
		}

		logger.info("execCtrlCmdProduceScheduler => End Time : " + LocalTime.now());
	}

	public void execCtrlCmdNextProduceScheduler() throws Exception {
		logger.info("execCtrlCmdNextProduceScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execCtrlCmdNextProduceScheduler => Start Time : " + LocalTime.now());

		HashMap<String, Object> map = new HashMap<>();
		int taskProcCnt = 20;

		try {
			ArrayList<String> sequenceActTypeList = new ArrayList<String>();
			sequenceActTypeList.add(Constant.CTRL_CMD_SEQUENCE_RUNNING);
			sequenceActTypeList.add(Constant.CTRL_CMD_SEQUENCE_END);
			map.put("sequenceActTypeList", sequenceActTypeList);

			map.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
			map.put("start", 0);
			map.put("end", 100);

			// 처리할 시퀀스 ID 정보를 가지고 온다 일단 100개 단위로 가지고 옴
			List<Integer> procSeqIdList = this.ctrlCmdTaskInfoService.getCtrlCmdSeqIdList(map);

			if (procSeqIdList != null && procSeqIdList.size() > 0) {
				Integer[] allSeqList = procSeqIdList.toArray(new Integer[procSeqIdList.size()]);

				// 총 처리 카운트 작업(taskProcCnt분할 할꺼기 때문에 taskProcCnt개단위로 묶음 갯수 확인, 나머지 갯수 +1 카운트)
				int taskCnt = procSeqIdList.size() / taskProcCnt + (procSeqIdList.size() % taskProcCnt == 0 ? 0 : 1);

				Integer[] ppSeqList = null;
				HashMap<String, Object> pMap = null;
				for (int a = 0; a < taskCnt; a++) {
					try {
						// 마지막에 나머지 갯수 처리
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

						pMap = new HashMap<>();
						// 실행대기 상태
						pMap.put("isProcTaskExists", "TASK");
						pMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_WAIT);
						pMap.put("procSeqList", ppSeqList);
						pMap.put("statusResultMsg", "Sequence Task Proc Update Success");

						// Task 정보에 넘기기 전에 처리해야 할 정보를 업데이트 해준다 중복처리 제거를 위해서. 상태는 실행 대기
						int proCnt = this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(pMap);

						// 상태정보 업데이트되야 이후 프로세스처리를 진행해야 한다.
						if (proCnt > 0) {
							CtrlCmdDistributedTask ccp = ctx.getBean(CtrlCmdDistributedTask.class);
							ccp.setParameter(pMap);
							executor.execute(ccp);

							ppSeqList = null;
						} else {
							logger.debug("CTRL_SEQUENCE_STATUS_WAIT UPDATE Count  ==>  0");
						}
					} catch (Exception e) {
						e.printStackTrace();

						if (ppSeqList != null) {
							// 에러 시 다시 실행시기기 위해 대기 상태로 돌려놓는다.
							pMap = new HashMap<>();
							// 실행대기 상태
							pMap.put("isProcTaskExists", "TASK");
							pMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
							pMap.put("procSeqList", ppSeqList);
							pMap.put("statusResultMsg", "Sequence Task Proc Update Error ==> Scheduler");

							this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(pMap);
						}
					}
					logger.debug("distribute ==> " + executor.getActiveCount() + "  :  " + executor.getQueueSize());
				}
			} else {
				logger.info("************ execCtrlCmdProduceScheduler checking not running process ************** ");
			}
		} catch (Exception e) {
			e.printStackTrace();
		}

		logger.info("execCtrlCmdProduceScheduler => End Time : " + LocalTime.now());
	}

}
