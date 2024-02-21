package iitp.federatedTwins.DtEvtTracking.trackDataSub.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.config.KafkaConsumer;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.TrackingDataSubscriberService;

@RestController
@RequestMapping("/fdt/detrck/sub")
public class TrackingDataSubscriberController {
	@Autowired
	ApplicationContext ctx;
	
	private final Logger logger = LoggerFactory.getLogger(TrackingDataSubscriberController.class);

	@Autowired
	public TrackingDataSubscriberService rsDtConsumerService;

	@PostMapping("/{target_dt_id}/control-results/{device_id}")
	public ResponseEntity<JSONObject> receiveResultData(HttpServletRequest request,
			@PathVariable("target_dt_id") String targetDtId, @PathVariable("device_id") String deviceId, @RequestBody HashMap<String, Object> data)
			throws Exception {		
		HttpHeaders httpHeaders = new HttpHeaders();
		HttpStatus resultSts = Constant.HTTP_OK_STAT;
		
		try {			
			logger.info("================ Consumer received ResultData ==============");						
			logger.info("ctrlIdentifier : {} " + data.get("ctrlIdentifier"));

			httpHeaders.add("Content-Type", request.getHeader("Content-Type"));
			
			resultSts = rsDtConsumerService.procReceiveResultData(data);

		} catch (Exception e) {
			logger.error("Error Message : {} "+ e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;			
		}
				
		return new ResponseEntity<>(httpHeaders, resultSts);

	}

	@GetMapping("/getTopic/{request_tracking_id}")
	public ResponseEntity<JSONObject> getTopic(HttpServletRequest request
			, @PathVariable("request_tracking_id") String topic) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		HttpStatus resultSts = Constant.HTTP_CREATE_STAT;

		logger.info("================ postReceiveControlCommands ================>> "+topic);

		try {
			logger.info("================ postReceiveControlCommands ================");
			
			TrackingProcessInfo trackingProcessInfo = rsDtConsumerService.getTopics(topic);
			
			List<String> topicList = trackingProcessInfo.getTopicList();
			List<Integer> proId = trackingProcessInfo.getProIdList();
			List<Integer> trakId = trackingProcessInfo.getReqTrkList();
			
			if (topicList != null) {
				for (int i = 0; i < topicList.size(); i++) {
					String topics  = topicList.get(i);
					Integer pro = proId.get(i);
					Integer trak = trakId.get(i);
					
					Map<String, Integer> sts = rsDtConsumerService.getInsertTopic(topic, pro, trak);
					
					int resId = sts.get("trackingResponseId");
					
					ctx.getBean(KafkaConsumer.class, String.valueOf(System.currentTimeMillis()), topics, "to23", resId, pro);
				}
			}
			
		} catch (Exception e) {
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
			logger.debug("resultSts : {} " , resultSts);
			logger.error("Error Message : {} " , e);
		}

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, resultSts);
	}
}
