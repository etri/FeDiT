package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service;

import java.util.HashMap;


public interface TrackingCmdPrdService {

	public void executeTaskProc(HashMap<String, Object> map) throws Exception;

	public int updateWithHisAndCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	public HashMap<String, Object> insertTaskProc(HashMap<String, Object> map) throws Exception;
}
