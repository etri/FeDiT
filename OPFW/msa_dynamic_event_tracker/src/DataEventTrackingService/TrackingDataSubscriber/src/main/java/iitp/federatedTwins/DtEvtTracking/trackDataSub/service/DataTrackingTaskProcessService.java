package iitp.federatedTwins.DtEvtTracking.trackDataSub.service;

import java.util.HashMap;

public interface DataTrackingTaskProcessService {

	public void dataTrackingProcessTask(HashMap<String, Object> map) throws Exception;

	public void eventTrackingProcessTask(HashMap<String, Object> param) throws Exception;

}
