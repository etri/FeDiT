package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.controller;

import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.TrackingCmdPrdService;


@RestController
@RequestMapping("/fdt/detrck/pub")
public class TrackingCmdPubResController {

	
	private final TrackingCmdPrdService ctrlCmdPrdService;
	
	private final Logger logger = LoggerFactory.getLogger(TrackingCmdPubResController.class);
	
	public TrackingCmdPubResController(TrackingCmdPrdService ctrlCmdPrdService) {
		this.ctrlCmdPrdService = ctrlCmdPrdService;
	}
	
	@GetMapping("/ctrlCmd/taskProc")
	public ResponseEntity<JSONObject> executeTackProc(HttpServletRequest request) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();
		HttpStatus resultSts = Constant.HTTP_OK_STAT;
		
		try {
			
			logger.debug("request : {} " + request.getParameter("requestTrackingId"));
			logger.debug("request : {} " + request.getParameter("trackingProcessId"));

			String requestTrackingId = request.getParameter("requestTrackingId");
			String trackingProcessId = request.getParameter("trackingProcessId");

			if(!"".equals(requestTrackingId) && requestTrackingId != null) {
				map.put("requestTrackingId", requestTrackingId);
			}
			
			if(!"".equals(trackingProcessId) && trackingProcessId != null) {
				map.put("trackingProcessId", trackingProcessId);
			}

			ctrlCmdPrdService.executeTaskProc(map);
			
			resultSts = Constant.HTTP_OK_STAT;
		} catch (Exception e) {
			logger.error("Error Message : {} " , e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
		}

		return new ResponseEntity<>(httpHeaders, resultSts);		
	}
}
