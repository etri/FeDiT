package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.task;

import java.util.HashMap;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Scope;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.common.abstractclass.ControlCommandSequenceTask;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.HttpTaskService;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.vo.CtrlCmdSeqTaskProcVO;

@Component
@Scope(value = "prototype")
public class StartSequenceTask extends ControlCommandSequenceTask {

	private final HttpTaskService httpTaskService;

	private final CtrlCmdTaskInfoService ctrlCmdTaskInfoService;

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdSequenceSendingTask.class);

	@Autowired
	@Qualifier("poolHttpClientConnManager")
	private PoolingHttpClientConnectionManager connManager;

	@Autowired
	@Qualifier("scheduleHttpTaskExecutor")
	private ScheduledThreadPoolExecutor interValScheduler;

	public StartSequenceTask(HttpTaskService httpTaskService, CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
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

			HashMap<String, Object> seqMap = new HashMap<String, Object>();
			seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_COMPLETE);
			seqMap.put("trackingProcessId", trackingCtrlCmdSeqTaskProc.getTrackingProcessId());
			seqMap.put("statusResultMsg", "=== Sequence Task Proc Update Success ===");
			this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);

			HashMap<String, Object> pMap = new HashMap<String, Object>();
			pMap.put("sequenceIdentifier", trackingCtrlCmdSeqTaskProc.getTrackingKafkaTopic());

			TrackingProcessInfo nextTrackingCtrlCmdSeq = httpTaskService.getControlCommandSequenceInfo(pMap);

			if (nextTrackingCtrlCmdSeq == null) {
				throw new RuntimeException(
						"**************** Error Occured which Next MsaCtrlCmdSequence Is Null *******************");
			}

			pMap.clear();
			pMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_READY);
			pMap.put("trackingProcessId", nextTrackingCtrlCmdSeq.getTrackingProcessId());
			pMap.put("statusResultMsg", "=== Sequence Task Proc Update Success ===");
			this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(pMap);

		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
		}
	}

	protected boolean checkNextStepFilter(TrackingProcessInfo msaSeqInfo) {
		return true;
	}

	protected boolean executeHttpConnection(TrackingProcessInfo msaSeqInfo) {
		return returnBool;
	}
}
