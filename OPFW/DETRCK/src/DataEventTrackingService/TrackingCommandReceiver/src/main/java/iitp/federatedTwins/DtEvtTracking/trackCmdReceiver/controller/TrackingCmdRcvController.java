package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.ibatis.javassist.expr.NewArray;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.parser.TrackingCmdValidator;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.service.TrackingCommandService;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;

@RestController
@RequestMapping("/fdt/detrck/rcv")
public class TrackingCmdRcvController {
	@Autowired
	ApplicationContext ctx;

	@Autowired
	TrackingCmdValidator ctrlCmdValidator;

	private final TrackingCommandService trackingCommandService;

	private final Logger logger = LoggerFactory.getLogger(TrackingCmdRcvController.class);

	public TrackingCmdRcvController(TrackingCommandService trackingCommandService) {
		this.trackingCommandService = trackingCommandService;
	}

	@PostMapping("/tracking-commands")
	public ResponseEntity<?> postReceiverackingCommands(HttpServletRequest request,
			@RequestBody TrackingCommandVO trackingCommand) throws Exception {

		JSONParser parser = new JSONParser();
		JSONObject obj = new JSONObject();
		JSONArray arr = new JSONArray();
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		LinkedHashMap<String, Object> map = new LinkedHashMap<>();

		HttpStatus resultSts = Constant.HTTP_CREATE_STAT;
		logger.info("================ postReceiveControlCommands ================");

		ArrayList<Object> trckProcInfoList = new ArrayList<Object>();
		try {

			// 파라메터 Validation 처리
			trackingCommand = ctrlCmdValidator.valideteTrackingCommands(trackingCommand);
			logger.info("================ procRequestControlCommand ================");
			map = this.trackingCommandService.procRequestTrackingCommand(trackingCommand);
			arr = (JSONArray) parser.parse(map.get("trckProcInfo").toString());

			for (int i = 0; i < arr.size(); i++) {
				LinkedHashMap<String, Object> param = new LinkedHashMap<>();
				obj = (JSONObject) arr.get(i);
				param.put("trckTp", obj.get("trckTp").toString());
				param.put("trckPrcIdtifier", obj.get("trckPrcIdtifier").toString());
				param.put("uuid-trckPrcIdtifier", obj.get("uuid-trckPrcIdtifier").toString());
				trckProcInfoList.add(param);
			}

			map.put("trckProcInfo", trckProcInfoList);

		} catch (Exception e) {
			logger.error("Error Message : {}", e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
		}

		return new ResponseEntity<>(map, httpHeaders, resultSts);
	}
	
	@DeleteMapping("/tracking-commands/{uuid-reqIdentifier}/trckProcInfos")
	public ResponseEntity<JSONObject> deleteTrackingCommands(HttpServletRequest request,
			@PathVariable("uuid-reqIdentifier") String trackingIdentifier			
			 ) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));
		
		String trckPrcIdtifier = null;
		HashMap<String, String> map = new HashMap<>();

		HttpStatus resultSts = Constant.HTTP_OK_STAT;
		logger.info("================ postReceiveControlCommands ================");
		
		try {		
			map.put("trackingIdentifier", trackingIdentifier);
			map.put("trckPrcIdtifier", trckPrcIdtifier);
			
			logger.info("uuid-reqIdentifier : {}" , trackingIdentifier);
			logger.info("uuid-trckPrcIdtifier : {}" , trckPrcIdtifier);
			
			map.put("mode", "A");
			
			resultSts = this.trackingCommandService.procDeleteTrackingCommand(map);			
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
		}
		
		
		return new ResponseEntity<>(new JSONObject(map), httpHeaders, resultSts);
	}
	
	@DeleteMapping("/tracking-commands/{uuid-reqIdentifier}/trckProcInfos/{uuid-trckPrcIdtifier}")
	public ResponseEntity<JSONObject> deleteTrackingCommand(HttpServletRequest request,
			@PathVariable("uuid-reqIdentifier") String trackingIdentifier
			, @PathVariable("uuid-trckPrcIdtifier") String trckPrcIdtifier ) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, String> map = new HashMap<>();

		HttpStatus resultSts = Constant.HTTP_OK_STAT;
		logger.info("================ postReceiveControlCommands ================");
		
		try {		
			map.put("trackingIdentifier", trackingIdentifier);
			map.put("trckPrcIdtifier", trckPrcIdtifier);
			
			logger.info("uuid-reqIdentifier : {}" , trackingIdentifier);
			logger.info("uuid-trckPrcIdtifier : {}" , trckPrcIdtifier);
			
			map.put("mode", "S");
			
			resultSts = this.trackingCommandService.procDeleteTrackingCommand(map);			
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
		}
		
		
		return new ResponseEntity<>(httpHeaders, resultSts);
	}
	
	
	@DeleteMapping("/tracking-commands/trckProcInfos/forceKilled")
	public ResponseEntity<JSONObject> deleteTrackingCommand(HttpServletRequest request,
			@RequestBody HashMap<String, String> body ) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, String> map = new HashMap<>();

		String trackingIdentifier = body.get("trackingIdentifier");
		String trckPrcIdtifier = body.get("trckPrcIdtifier");
		
		String opType = body.get("opType");
		
		HttpStatus resultSts = Constant.HTTP_OK_STAT;
		logger.info("================ postReceiveControlCommands ================");
		
		try {		
			map.put("trackingIdentifier", trackingIdentifier);
			map.put("trckPrcIdtifier", trckPrcIdtifier);
			
			logger.info("uuid-reqIdentifier : {}" , trackingIdentifier);
			logger.info("uuid-trckPrcIdtifier : {}" , trckPrcIdtifier);
			
			map.put("opType", opType);
			map.put("mode", "A");
			
			resultSts = this.trackingCommandService.procDeleteTrackingCommand(map);			
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
		}
		
		
		return new ResponseEntity<>(httpHeaders, resultSts);
	}
	 
}
