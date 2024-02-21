package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.service;

import java.util.HashMap;

import org.springframework.http.HttpStatus;

import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;

public interface TrackingCommandService {

	public HashMap<String, Object> insertRequestRegisteFdtObjData(TrackingCommandVO trackingCommand) throws Exception;

	public int insertRequestTrackingCommand(TrackingCommandVO trackingCommand) throws Exception;

	public int insertTrackingCommandSequence(HashMap<String, Object> map) throws Exception;

	public int insertMultiRegTrackingCommandSeq(TrackingCommandVO trackingCommand) throws Exception;

	public HttpStatus procRequestTrackingCommand(TrackingCommandVO trackingCommand) throws Exception;

	public HttpStatus procRequestRegisteFdtObjData(TrackingCommandVO trackingCommand) throws Exception;


}
