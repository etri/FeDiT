package iitp.federatedTwins.msaOrchstr.common.intrface;

import java.util.HashMap;

public interface ExecSequenceTask {
	HashMap<String, Object> map = null;
	String TASK_PROC_STEP = "RUNNING";
	String statusCode = "";

	public void setParameter(HashMap<String, Object> map);

}
