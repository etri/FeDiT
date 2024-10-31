package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.controller;

import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.component.KafkaManager;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.component.KafkaProducer;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.component.RabbitMQComponent;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.TrackingCmdPrdService;

@RestController
@RequestMapping("/fdt/detrck/pub")
public class TrackingCmdPubResController {

	@Autowired
	ApplicationContext ctx;

	private final TrackingCmdPrdService ctrlCmdPrdService;

	private final Logger logger = LoggerFactory.getLogger(TrackingCmdPubResController.class);

	@Autowired
	private KafkaManager kafkaManager;

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

			logger.debug("requestTrackingId : {} " + request.getParameter("requestTrackingId"));

			String requestTrackingId = request.getParameter("requestTrackingId");

			if (!"".equals(requestTrackingId) && requestTrackingId != null) {
				map.put("requestTrackingId", requestTrackingId);
				map.put("flage", "N");
			}

			ctrlCmdPrdService.executeTrackingCommndProc(map);

			resultSts = Constant.HTTP_OK_STAT;
		} catch (Exception e) {
			logger.error("Error Message : {} ", e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
		}

		return new ResponseEntity<>(httpHeaders, resultSts);
	}

	@GetMapping("/ctrlCmd/taskProc/single")
	public ResponseEntity<JSONObject> executeTackProcSingle(HttpServletRequest request) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();
		HttpStatus resultSts = Constant.HTTP_OK_STAT;

		try {

			logger.debug("requestTrackingId : {} " + request.getParameter("requestTrackingId"));
			logger.debug("trackingProcessId : {} " + request.getParameter("trackingProcessId"));

			String requestTrackingId = request.getParameter("requestTrackingId");
			String trackingProcessId = request.getParameter("trackingProcessId");

			if (!"".equals(requestTrackingId) && requestTrackingId != null) {
				map.put("requestTrackingId", requestTrackingId);
				map.put("flage", "N");
			}

			if (!"".equals(trackingProcessId) && trackingProcessId != null) {
				map.put("trackingProcessId", trackingProcessId);
			}

			ctrlCmdPrdService.executeTrackingProcessSingle(map);

			resultSts = Constant.HTTP_OK_STAT;
		} catch (Exception e) {
			logger.error("Error Message : {} ", e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
		}

		return new ResponseEntity<>(httpHeaders, resultSts);
	}

	@PostMapping("/kafkaSend")
	public ResponseEntity<JSONObject> getKafkaSend(HttpServletRequest request,
			@RequestBody String body) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HttpStatus resultSts = Constant.HTTP_CREATE_STAT;
		logger.info("================ Publisher kafkaSend ==============");		
		HashMap<String, Object> map = new HashMap<>();
		
		try {
			JSONParser parser = new JSONParser();
			JSONObject jsonObject = (JSONObject) parser.parse(body);
			
			map.put("topic", jsonObject.get("topic"));
			map.put("group", jsonObject.get("group"));
			map.put("payload", jsonObject.get("payload"));

			String sendRoutingKey = (String)jsonObject.get("sendRoutingKey");

			RabbitMQComponent rabbitMQ = ctx.getBean(RabbitMQComponent.class);
			rabbitMQ.sendMessage(jsonObject, sendRoutingKey);

		} catch (Exception e) {
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
			logger.debug("resultSts : {} ", resultSts);
			logger.error("Error Message : {} ", e);
		}

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, resultSts);
	}

	@GetMapping(value = "/deleteTopic")
	public ResponseEntity<JSONObject>  deleteTopic(HttpServletRequest request, String topic) {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();
		HttpStatus resultSts = Constant.HTTP_OK_STAT;

		try {
			kafkaManager.deleteTopic(topic);

			map.put("topic", topic);
			map.put("payload", "Delete Message");
			map.put("mode", "R");

			KafkaProducer kafkaProducer = ctx.getBean(KafkaProducer.class);
			kafkaProducer.sendTopic(map);

		} catch (Exception e) {
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
			logger.debug("resultSts : {} ", resultSts);
			logger.error("Error Message : {} ", e);
		}

		return new ResponseEntity<>(httpHeaders, resultSts);
	}

}
