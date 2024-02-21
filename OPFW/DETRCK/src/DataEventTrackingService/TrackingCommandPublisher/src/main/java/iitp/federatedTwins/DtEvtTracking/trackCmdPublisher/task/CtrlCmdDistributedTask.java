package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.task;

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

import iitp.federatedTwins.DtEvtTracking.common.abstractclass.ControlCommandSequenceTask;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.schdule.CtrlCmdPublisherScheduler;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.HttpTaskService;

@Component
@Scope(value = "prototype")
public class CtrlCmdDistributedTask implements Runnable {
	@Autowired
	ApplicationContext ctx;

	@Autowired
	CtrlCmdPublisherScheduler produceScheduler;

	@Autowired
	@Qualifier("scheduleHttpTaskExecutor")
	private ScheduledThreadPoolExecutor interValScheduler;

	@Autowired
	@Qualifier("httpTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	private final HttpTaskService httpTaskService;

	private final CtrlCmdTaskInfoService ctrlCmdTaskInfoService;

	private String taskName;

	private HashMap<String, Object> map;

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdDistributedTask.class);

	public CtrlCmdDistributedTask(HttpTaskService httpTaskService, CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.httpTaskService = httpTaskService;
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;
	}

	public void setTaskName(String taskName) {
		this.taskName = taskName;
	}

	public void setParameter(HashMap<String, Object> map) {
		this.map = map;
	}

	@Override
	public void run() {
		try {
			logger.info("CtrlCmdProduceTask Current Thread : {}", Thread.currentThread().getName());
			logger.info("CtrlCmdProduceTask execCtrlCmdProduceScheduler => time : " + LocalTime.now());
			logger.debug("CtrlCmdProduceTask setParameter ==> " + this.map);
			List<TrackingProcessInfo> trackingProcessInfo = httpTaskService
					.getControlCommandTaskInfoList(this.map);

			for (TrackingProcessInfo trackingProcess : trackingProcessInfo) {
				try {
					logger.debug("===============  msaControlCommandSequence.getCtrlCmdSequenceId() id  ==>  "
							+ trackingProcess.getTrackingProcessId());

					TrackingTaskProcessingInfo trackingTaskProcessingInfo = new TrackingTaskProcessingInfo();
					trackingTaskProcessingInfo.setTrackingProcessId(trackingProcess.getTrackingProcessId());
					trackingTaskProcessingInfo.setRequestTrackingId(trackingProcess.getRequestTrackingId());
					trackingTaskProcessingInfo.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_READY);

					int count = httpTaskService.insertTaskProcessing(trackingTaskProcessingInfo);

					if (count > 0) {
						executeActTypeSequencialProc(trackingProcess, trackingTaskProcessingInfo);
					} else {
						throw new RuntimeException(
								"****************  Msa Sequence Task Insert Processing Runtime Error *******************");
					}
				} catch (Exception e) {
					logger.error("Error Message : {}" , e);

					int trackingProcessId = trackingProcess.getTrackingProcessId();

					HashMap<String, Object> seqMap = new HashMap<String, Object>();
					seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
					seqMap.put("trackingProcessId", trackingProcessId);
					seqMap.put("statusResultMsg", "Sequence Task Proc Update Error ==> Distribute Task");

					this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);
				}
			}

			logger.debug("httpExecutor ==> " + executor.getActiveCount() + "  :  " + executor.getQueueSize());
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
		}
	}

	private void executeActTypeSequencialProc(TrackingProcessInfo msaControlCommandSequence,
			TrackingTaskProcessingInfo msaTaskProcessingInfo) {
		int taskProcessingId = msaTaskProcessingInfo.getTaskProcessingId();
		String federatedTwinId = msaControlCommandSequence.getFederatedTwinId();
		String federatedDigitalObjectId = msaControlCommandSequence.getFederatedDigitalObjectId();
		String digitalTwinId = msaControlCommandSequence.getDigitalTwinId();
		String digitalObjectId = msaControlCommandSequence.getDigitalObjectId();
		String trackingCommand = msaControlCommandSequence.getTrackingCommand();
		String trackingParam = msaControlCommandSequence.getTrackingKafkaGroup();
		int trackingProcessId = msaControlCommandSequence.getTrackingProcessId();
		int requestTrackingId = msaControlCommandSequence.getRequestTrackingId();

		try {
			logger.debug("===============  msaControlCommandSequence.getCtrlCmdSequenceId() id  ==>  "
					+ msaControlCommandSequence.getTrackingProcessId());

			HashMap<String, Object> map = new HashMap<>();
			map.put("federatedTwinId", federatedTwinId);
			map.put("federatedDigitalObjectId", federatedDigitalObjectId);

			map.put("digitalTwinId", digitalTwinId);
			map.put("digitalObjectId", digitalObjectId);

			map.put("trackingCommand", trackingCommand);
			map.put("trackingParam", trackingParam);
			map.put("taskProcessingId", taskProcessingId);
			map.put("trackingProcessId", trackingProcessId);
			map.put("reqCtrlCmdId", requestTrackingId);

			ControlCommandSequenceTask ctrlCmdSeqTask = null;

			if (Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(msaControlCommandSequence.getTrackingProcessType()))
				ctrlCmdSeqTask = ctx.getBean(SingleSequenceTask.class);
			else if (Constant.CTRL_CMD_SEQUENCE_START.equals(msaControlCommandSequence.getTrackingProcessType()))
				ctrlCmdSeqTask = ctx.getBean(StartSequenceTask.class);
			else if (Constant.CTRL_CMD_SEQUENCE_RUNNING.equals(msaControlCommandSequence.getTrackingProcessType()))
				ctrlCmdSeqTask = ctx.getBean(RunningSequenceTask.class);
			else if (Constant.CTRL_CMD_SEQUENCE_END.equals(msaControlCommandSequence.getTrackingProcessType()))
				ctrlCmdSeqTask = ctx.getBean(EndSequenceTask.class);

			ctrlCmdSeqTask.setTaskParameter(map);

			long strInterval = msaControlCommandSequence.getEventOccurredCount();

			if (strInterval < 1) {
				executor.execute(ctrlCmdSeqTask);
			} else {
				interValScheduler.schedule(ctrlCmdSeqTask, strInterval, TimeUnit.MILLISECONDS);
			}

		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
			try {
				HashMap<String, Object> seqMap = new HashMap<String, Object>();
				seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
				seqMap.put("ctrlCmdSequenceId", trackingProcessId);
				seqMap.put("statusResultMsg", "Sequence Task Proc Update Error ==> Distribute Task ==> SendingTask");

				this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);

				TrackingTaskProcessingInfo mtpsi = new TrackingTaskProcessingInfo();
				mtpsi.setTrackingProcessId(trackingProcessId);
				mtpsi.setRequestTrackingId(requestTrackingId);
				mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_ERROR);
				mtpsi.setTaskProcessingId(taskProcessingId);
				httpTaskService.updateTaskProcessing(mtpsi);

			} catch (Exception ex) {
				logger.error("Error Message : {}" , ex);
			}
		}
	}
}
