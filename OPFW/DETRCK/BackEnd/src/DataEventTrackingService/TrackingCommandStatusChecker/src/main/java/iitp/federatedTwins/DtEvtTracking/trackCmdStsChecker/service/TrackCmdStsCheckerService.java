package iitp.federatedTwins.DtEvtTracking.trackCmdStsChecker.service;

public interface TrackCmdStsCheckerService {

	public void checkRunningStatus() throws Exception;
	
	public void checkTopicErrStatus() throws Exception;
	
	public void forceProcessKilled() throws Exception;

	public void checkTimeOutStatus() throws Exception;

	public void purgeClosedTrackingData() throws Exception;

}
