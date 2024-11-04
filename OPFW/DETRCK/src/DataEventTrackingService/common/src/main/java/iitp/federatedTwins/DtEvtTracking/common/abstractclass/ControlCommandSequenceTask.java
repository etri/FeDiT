package iitp.federatedTwins.DtEvtTracking.common.abstractclass;

import java.util.HashMap;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;

public abstract class ControlCommandSequenceTask implements Runnable {
	protected HashMap<String, Object> taskParam;
	protected String TASK_PROC_STEP = "RUNNING";
	protected String statusCode;

	protected boolean returnBool = false;

	public void setTaskParameter(HashMap<String, Object> taskParam) {
		this.taskParam = taskParam;
	}

	public HashMap<String, Object> getTaskParameter() {
		return this.taskParam;
	}

	protected abstract void executeNextSequenceProc(TrackingProcessInfo msaCtrlCmdSeqTaskProc);

	protected abstract boolean executeHttpConnection(TrackingProcessInfo msaCtrlCmdSeqTaskProc);

	protected abstract boolean checkNextStepFilter(TrackingProcessInfo msaCtrlCmdSeqTaskProc);
}
