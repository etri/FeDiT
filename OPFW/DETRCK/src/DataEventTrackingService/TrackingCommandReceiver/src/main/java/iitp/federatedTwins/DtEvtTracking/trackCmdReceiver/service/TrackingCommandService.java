package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;

import org.json.simple.JSONObject;
import org.springframework.http.HttpStatus;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;

public interface TrackingCommandService {

	public LinkedHashMap<String, Object> procRequestTrackingCommand(TrackingCommandVO trackingCommand) throws Exception;
	
	public HttpStatus procDeleteTrackingCommand(HashMap<String, String> map) throws Exception;
	
	public LinkedHashMap<String, Object> findTrckProcList(String trackingIdentifier) throws Exception;
	
	public LinkedHashMap<String, Object> findTrckReqList() throws Exception;
}
