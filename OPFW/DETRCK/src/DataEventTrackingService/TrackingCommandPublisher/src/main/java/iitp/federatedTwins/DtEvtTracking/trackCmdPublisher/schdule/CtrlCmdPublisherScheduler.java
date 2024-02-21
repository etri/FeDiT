package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.schdule;

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
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.task.CtrlCmdDistributedTask;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.task.CtrlCmdSequenceSendingTask;

@Component
public class CtrlCmdPublisherScheduler {
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

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdPublisherScheduler.class);

	public CtrlCmdPublisherScheduler(CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;
	}

	public void addTaskSeqList(CtrlCmdSequenceSendingTask taskSeq) {
		logger.debug("***************** addTaskSeqList sequenceId ==> "
				+ taskSeq.getTaskParameter().get("ctrlCmdSequenceId"));
		this.taskSeqList.add(taskSeq);
	}

//	@Scheduled(initialDelay = 0, fixedRate = 1000)
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

			List<Integer> procSeqIdList = this.ctrlCmdTaskInfoService.getCtrlCmdSeqIdList(map);

			if (procSeqIdList != null && procSeqIdList.size() > 0) {
				Integer[] allSeqList = procSeqIdList.toArray(new Integer[procSeqIdList.size()]);

				logger.debug("***************** execCtrlCmdProduceScheduler proc cout ==> " + allSeqList.length);

				int taskCnt = procSeqIdList.size() / taskProcCnt + (procSeqIdList.size() % taskProcCnt == 0 ? 0 : 1);
				logger.debug("***************** execCtrlCmdProduceScheduler taskCnt cout ==> " + taskCnt);

				Integer[] ppSeqList = null;
				HashMap<String, Object> pMap = null;
				for (int a = 0; a < taskCnt; a++) {
					try {
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
						pMap.put("isProcTaskExists", "TASK");
						pMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_WAIT);
						pMap.put("procSeqList", ppSeqList);
						pMap.put("statusResultMsg", "Sequence Task Proc Update Success");

						int proCnt = this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(pMap);

						if (proCnt > 0) {
							CtrlCmdDistributedTask ccp = ctx.getBean(CtrlCmdDistributedTask.class);
							ccp.setParameter(pMap);
							executor.execute(ccp);

							ppSeqList = null;
						} else {
							logger.debug("CTRL_SEQUENCE_STATUS_WAIT UPDATE Count  ==>  0");
						}
					} catch (Exception e) {
						logger.error("Error Message : {} "+ e);

						if (ppSeqList != null) {
							pMap = new HashMap<>();
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
			logger.error("Error Message : {} "+ e);
		}

		logger.info("execCtrlCmdProduceScheduler => End Time : " + LocalTime.now());
	}

//	@Scheduled(initialDelay = 0, fixedRate = 1000)
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

			List<Integer> procSeqIdList = this.ctrlCmdTaskInfoService.getCtrlCmdSeqIdList(map);

			if (procSeqIdList != null && procSeqIdList.size() > 0) {
				Integer[] allSeqList = procSeqIdList.toArray(new Integer[procSeqIdList.size()]);

				logger.debug("***************** execCtrlCmdProduceScheduler proc cout ==> " + allSeqList.length);

				int taskCnt = procSeqIdList.size() / taskProcCnt + (procSeqIdList.size() % taskProcCnt == 0 ? 0 : 1);
				logger.debug("***************** execCtrlCmdProduceScheduler taskCnt cout ==> " + taskCnt);

				Integer[] ppSeqList = null;
				HashMap<String, Object> pMap = null;
				for (int a = 0; a < taskCnt; a++) {
					try {
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
						pMap.put("isProcTaskExists", "TASK");
						pMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_WAIT);
						pMap.put("procSeqList", ppSeqList);
						pMap.put("statusResultMsg", "Sequence Task Proc Update Success");

						int proCnt = this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(pMap);

						if (proCnt > 0) {
							CtrlCmdDistributedTask ccp = ctx.getBean(CtrlCmdDistributedTask.class);
							ccp.setParameter(pMap);
							executor.execute(ccp);

							ppSeqList = null;
						} else {
							logger.debug("CTRL_SEQUENCE_STATUS_WAIT UPDATE Count  ==>  0");
						}
					} catch (Exception e) {
						logger.error("Error Message : {} "+ e);

						if (ppSeqList != null) {
							pMap = new HashMap<>();
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
			logger.error("Error Message : {} "+ e);
		}

		logger.info("execCtrlCmdProduceScheduler => End Time : " + LocalTime.now());
	}

}
