package iitp.fedit.apiGateway.receiver.controller;

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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iitp.fedit.apiGateway.common.dto.DigitalTwinRequestCtrlCmdInfo;
import iitp.fedit.apiGateway.common.util.Constant;
import iitp.fedit.apiGateway.receiver.service.ReqCtrlCmdService;

/**
 * @파일명 : CtrlCmdRcvController.java
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @변경이력 :
 * @description :
 */
@RestController
@RequestMapping("/fedit/api-gateway/rcv")
public class CtrlCmdRcvController {

	@Autowired
	ApplicationContext ctx;

	@Autowired
	private ReqCtrlCmdService reqCtrlCmdService;
	private final Logger logger = LoggerFactory.getLogger(CtrlCmdRcvController.class);
//
//	@PostMapping("/{federated_twin_id}/federated_digital_objects/{federated_digital_object_id}/digital_twins/{digital_twin_id}/digital_objects/{digital_object_id}/control")
//	public ResponseEntity<JSONObject> postReceiveCtrlCmd(HttpServletRequest request,
//			@PathVariable("federated_twin_id") String federatedTwinId,
//			@PathVariable("federated_digital_object_id") String federatedDigitalObjectId,
//			@PathVariable("digital_object_id") String digitalObjectId,
//			@PathVariable("digital_twin_id") String digitalTwinId, @RequestBody HashMap<String, Object> params)
//			throws Exception {

	@PostMapping("/federated_digital_objects/digital_twins/digital_objects/control")
	public ResponseEntity<JSONObject> postReceiveCtrlCmd(HttpServletRequest request,
			@RequestBody HashMap<String, Object> params) throws Exception {

		logger.info("postReceiveCtrlCmd Params : {}", params);

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		HttpStatus resultSts = Constant.HTTP_CREATE_STAT;

		logger.info("================ postReceiveCtrlCmd ================");

		try {
//			logger.info("postReceiveCtrlCmd digitalObjectId : {}", digitalObjectId);
//			logger.info("postReceiveCtrlCmd digitalTwinId : {}", digitalTwinId);
//			logger.info("postReceiveCtrlCmd federatedTwinId : {}", federatedTwinId);
//			logger.info("postReceiveCtrlCmd federatedDigitalObjectId : {}", federatedDigitalObjectId);
			logger.info("postReceiveCtrlCmd Params : {}", params);

			//신규추가
			if (params.get("federated_digital_twin_id") == null || "".equals(params.get("federated_digital_twin_id"))) {
				throw new Exception("******** federated_digital_twin_id not Exists Error  ***********");
			}
			if (params.get("federated_digital_object_id") == null || "".equals(params.get("federated_digital_object_id"))) {
				throw new Exception("******** federated_digital_object_id not Exists Error  ***********");
			}
			
			if (params.get("digital_twin_id") == null || "".equals(params.get("digital_twin_id"))) {
				throw new Exception("******** digital_twin_id not Exists Error  ***********");
			}
			if (params.get("digital_object_id") == null || "".equals(params.get("digital_object_id"))) {
				throw new Exception("******** digital_object_id not Exists Error  ***********");
			}
			if (params.get("federated_digital_object_control_data_id") == null || "".equals(params.get("federated_digital_object_control_data_id"))) {
				throw new Exception("******** federated_digital_object_control_data_id not Exists Error  ***********");
			}
			


			DigitalTwinRequestCtrlCmdInfo digitalTwinRequestCtrlCmdInfo = new DigitalTwinRequestCtrlCmdInfo();

			
			digitalTwinRequestCtrlCmdInfo.setFederatedTwinId(params.get("federated_digital_twin_id").toString());
			digitalTwinRequestCtrlCmdInfo.setFederatedDigitalObjectId(params.get("federated_digital_object_id").toString());
			digitalTwinRequestCtrlCmdInfo.setDigitalTwinId(params.get("digital_twin_id").toString());
			digitalTwinRequestCtrlCmdInfo.setDigitalObjectId(params.get("digital_object_id").toString());
			digitalTwinRequestCtrlCmdInfo.setRespIdentifier(params.get("federated_digital_object_control_data_id").toString());
			digitalTwinRequestCtrlCmdInfo.setReqCtrlCommand(params.get("control_command").toString());

			if (params.get("control_command") != null && !params.get("control_command").toString().equals("")) {
				resultSts = reqCtrlCmdService.procRequestControlCommand(digitalTwinRequestCtrlCmdInfo);
			}

		} catch (Exception e) {
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
			logger.debug("resultSts : {} ", resultSts);
			logger.error("Error Message : {} ", e);
		}

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, resultSts);
	}

	
	@PostMapping("/federated_digital_objects/test")
	public ResponseEntity<JSONObject> postReceiveTest(HttpServletRequest request,
			@RequestBody HashMap<String, Object> params) throws Exception {
		
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		HttpStatus resultSts = Constant.HTTP_CREATE_STAT;
		
		HashMap<String, Object> control_execution_result = (HashMap<String, Object>)params.get("control_execution_result");
		
		try {
			HashMap<String, Object> expression = (HashMap<String, Object>)control_execution_result.get("expression");
			
			String execResultCode = (String)expression.get("execResultCode");			
			String execResultValue = (String)expression.get("execResultValue");
			String execResultMsg = (String)expression.get("execResultMsg");
		} 
		catch(Exception e) {
			e.printStackTrace();
		}
		
		
		
		
		logger.info("postReceiveCtrlCmd Params : {}", params);
		
		
		return new ResponseEntity<>(new JSONObject(map), httpHeaders, resultSts);
	}
}
