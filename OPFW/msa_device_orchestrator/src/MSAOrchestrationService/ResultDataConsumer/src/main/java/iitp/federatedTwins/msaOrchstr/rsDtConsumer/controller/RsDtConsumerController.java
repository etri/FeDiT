package iitp.federatedTwins.msaOrchstr.rsDtConsumer.controller;

import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.rsDtConsumer.component.RabbitMQComponent;
import iitp.federatedTwins.msaOrchstr.rsDtConsumer.service.impl.RsDtConsumerRMQServiceImpl;

/**
 * @파일명 : RsDtConsumerController.java
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @변경이력 :
 * @description :
 */
@RestController
@RequestMapping("/fdt/msaoc/csm")
public class RsDtConsumerController {
	RestTemplate restTemplate = new RestTemplate();

	private final Logger logger = LoggerFactory.getLogger(RsDtConsumerController.class);

	@Autowired
	RabbitMQComponent rabbitMqComponent;

	@Autowired
	public RsDtConsumerRMQServiceImpl rsDtConsumerRMQService;

	@PostMapping("/control-results")
	public ResponseEntity<JSONObject> receiveResultData(HttpServletRequest request,
			@RequestBody HashMap<String, Object> data) throws Exception {
		HttpHeaders httpHeaders = new HttpHeaders();
		HttpStatus resultSts = Constant.HTTP_OK_STAT;

		try {
			logger.info("federated_digital_object_control_data_id : {} "
					+ data.get("federated_digital_object_control_data_id"));
			logger.info("================ Consumer received control_execution_result ==============>> "
					+ data.get("control_execution_result"));

			if (data.get("federated_digital_object_control_data_id") != null
					&& data.get("control_execution_result") != null
					&& !"".equals(data.get("federated_digital_object_control_data_id"))
					&& !"".equals(data.get("control_execution_result"))) {
				httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

				logger.info("================ procReceiveResultData param data ==============>> " + data.toString());

				resultSts = rsDtConsumerRMQService.procReceiveResultData(data, rabbitMqComponent);
			} else {
				logger.info(" ************* receiveResultData param is empty Error ************* ");
			}
		} catch (Exception e) {
			logger.error("Error Message : {} ", e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
			logger.debug("resultSts : {} ", resultSts);
		}

		return new ResponseEntity<>(httpHeaders, resultSts);

	}

//	@PostMapping("/{target_dt_id}/control-results/{device_id}")
//	public ResponseEntity<JSONObject> receiveResultData(HttpServletRequest request,
//			@PathVariable("target_dt_id") String targetDtId, @PathVariable("device_id") String deviceId,
//			@RequestBody HashMap<String, Object> data) throws Exception {
//		HttpHeaders httpHeaders = new HttpHeaders();
//		HttpStatus resultSts = Constant.HTTP_OK_STAT;
//
//		try {
//			logger.info("reqCtrlCmdIdentifier : {} " + data.get("reqCtrlCmdIdentifier"));
//			logger.info("================ Consumer received ResultData ==============>> " + data.get("controlResult"));
//
//			if (data.get("reqCtrlCmdIdentifier") != null && data.get("controlResult") != null
//					&& !"".equals(data.get("reqCtrlCmdIdentifier")) && !"".equals(data.get("controlResult"))) {
//				httpHeaders.add("Content-Type", request.getHeader("Content-Type"));
//				resultSts = rsDtConsumerService.procReceiveResultData(data, rabbitMqComponent);
//			} else {
//				logger.info(" ************* receiveResultData param is empty Error ************* ");
//			}
//		} catch (Exception e) {
//			logger.error("Error Message : {} ", e);
//			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
//			logger.debug("resultSts : {} ", resultSts);
//		}
//
//		return new ResponseEntity<>(httpHeaders, resultSts);
//
//	}
}
