package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service;

import java.util.HashMap;

import org.json.simple.JSONObject;


public interface TrackingCmdPrdService {

	public void executeTrackingCommndProc(HashMap<String, Object> map) throws Exception;
	
	public void executeTrackingProcessSingle(HashMap<String, Object> map) throws Exception;

	public int updateWithHisAndTrackingProcInfo(HashMap<String, Object> map) throws Exception;

	public void deleteProcess(JSONObject json) throws Exception;

	public void updateProcessAndInsertTopic(HashMap<String, Object> map) throws Exception;

	public void insertTopic(HashMap<String, Object> map) throws Exception;

}
