package iitp.fedit.apiGateway.receiver.controller;

import java.util.HashMap;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import iitp.fedit.apiGateway.common.dto.CtrlDeviceInfo;
import iitp.fedit.apiGateway.common.dto.CtrlDeviceRoutingServiceInfo;
import iitp.fedit.apiGateway.common.util.Constant;
import iitp.fedit.apiGateway.receiver.service.DeviceService;
import iitp.fedit.apiGateway.receiver.service.PTZCommandService;
import iitp.fedit.apiGateway.receiver.service.impl.DeviceRoutingServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "RoutingController", description = "사용자 API")
@RestController
@RequestMapping("/fedit/gateway")
public class RoutingController {

	@Autowired
	private DeviceService deviceService;

	@Autowired
	private DeviceRoutingServiceImpl deviceRoutingService;

	@Autowired
	private PTZCommandService ptzCommandService;

	private final Logger logger = LoggerFactory.getLogger(RoutingController.class);

	@Operation(summary = "Device-Create")
	@PostMapping("/admin/devices")
	public ResponseEntity<JSONObject> insertGatewayDeviceInfo(HttpServletRequest request,
			@RequestBody List<CtrlDeviceInfo> ctrlDeviceList) throws Exception {

		logger.info("================ Insert Gateway DeviceInfo Data ==============");

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		// 장비 등록
		deviceService.createDevice(ctrlDeviceList);

		map.put("statusCode", Constant.HTTP_CREATE_CODE);
		map.put("httpStatus", Constant.HTTP_CREATE_STAT);

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, Constant.HTTP_CREATE_STAT);
	}

	// 장비 조회
	@Operation(summary = "Device-info", description = "장비 식별자를 통해서 장비를 조회한다.")
	@Parameters({
			@Parameter(name = "deviceIdentifier", required = false, description = "장비 식별자", in = ParameterIn.PATH) })
	@GetMapping("/admin/devices/{deviceIdentifier}")
	public ResponseEntity<JSONObject> getDeviceList(HttpServletRequest request,
			@PathVariable("deviceIdentifier") String deviceIdentifier) throws Exception {

		logger.info("================ getDeviceInfoList ==============");
		logger.info(" deviceIdentifier : {} ", deviceIdentifier);

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		if (deviceIdentifier != null) {
			map.put("deviceIdentifier", deviceIdentifier);
		} else {
			throw new Exception("******deviceIdentifier is Null******");
		}

		List<CtrlDeviceInfo> ctrlDeviceInfoList = deviceService.getDeviceInfoList(map);

		if (ctrlDeviceInfoList == null || ctrlDeviceInfoList.isEmpty()) {
			throw new Exception("******deviceIdentifier is Undifined******");
		}

		map.clear();

		map.put("devices", ctrlDeviceInfoList);
		map.put("totalCnt", ctrlDeviceInfoList.size());
		map.put("statusCode", Constant.HTTP_OK_CODE);
		map.put("httpStatus", Constant.HTTP_OK_STAT);

		JSONObject result = new JSONObject(map);

		return new ResponseEntity<>(result, httpHeaders, Constant.HTTP_OK_STAT);
	}

	// 장비 삭제
	@Operation(summary = "Device-Remove", description = "장비 식별자를 통해서 장비를 제거한다.")
	@Parameters({
			@Parameter(name = "deviceIdentifier", required = false, description = "장비 식별자", in = ParameterIn.PATH) })
	@DeleteMapping("/admin/devices/{deviceIdentifier}")
	public ResponseEntity<JSONObject> removeGatewayDeviceInfo(HttpServletRequest request,
			@PathVariable("deviceIdentifier") String deviceIdentifier) throws Exception {

		logger.info("================ Remove Gateway DeviceInfo Data ==============");
		logger.info(" deviceIdentifier : {} ", deviceIdentifier);

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		// 장비 삭제
		map.put("deviceIdentifier", deviceIdentifier);

		CtrlDeviceInfo ctrlDeviceInfo = deviceService.getDeviceInfo(map);

		if (ctrlDeviceInfo == null) {
			throw new Exception("******deviceIdentifier is Undifined******");
		}

		deviceService.removeDevice(map);

		map.clear();
		map.put("statusCode", Constant.HTTP_OK_CODE);
		map.put("httpStatus", Constant.HTTP_OK_STAT);

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, Constant.HTTP_OK_STAT);
	}

	@Operation(summary = "Device-Update")
	@Parameters({
			@Parameter(name = "deviceIdentifier", required = false, description = "장비 식별자", in = ParameterIn.PATH), })
	@PutMapping("/admin/devices/{deviceIdentifier}")
	public ResponseEntity<JSONObject> updateDeviceInfo(HttpServletRequest request,
			@PathVariable("deviceIdentifier") String deviceIdentifier, @RequestBody CtrlDeviceInfo ctrlDeviceInfo)
			throws Exception {

		logger.info("================ Update Gateway DeviceInfo Data ==============");
		logger.info(" deviceIdentifier : {} ", deviceIdentifier);

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		if (deviceIdentifier != null && !deviceIdentifier.equals("")) {
			ctrlDeviceInfo.setDeviceIdentifier(deviceIdentifier);
			map.put("deviceIdentifier", deviceIdentifier);
		} else {
			throw new Exception("deviceIdentifier is null or Empty");
		}

		CtrlDeviceInfo ctrlDevice = deviceService.getDeviceInfo(map);

		if (ctrlDevice == null) {
			throw new Exception("******deviceIdentifier is Undifined******");
		}

		deviceService.updateDevice(ctrlDeviceInfo);

		map.clear();
		map.put("statusCode", Constant.HTTP_OK_CODE);
		map.put("httpStatus", Constant.HTTP_OK_STAT);

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, Constant.HTTP_OK_STAT);
	}

	@Operation(summary = "RoutingKey-insert")
	@PostMapping("/routing-key-in")
	public ResponseEntity<JSONObject> insertRoutingKey(HttpServletRequest request,
			@RequestBody List<CtrlDeviceRoutingServiceInfo> ctrlDeviceCmdExecReqRespList) throws Exception {

		logger.info("================ Insert Real Time Sensors Data ==============");

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		// 라우팅키 등록
		deviceRoutingService.insertDeviceRoutingKey(ctrlDeviceCmdExecReqRespList);

		map.put("statusCode", Constant.HTTP_CREATE_CODE);
		map.put("httpStatus", Constant.HTTP_CREATE_STAT);

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, Constant.HTTP_OK_STAT);
	}

	@Operation(summary = "RoutingKey-Update")
	@PutMapping("/routing-key-control")
	public ResponseEntity<JSONObject> updateRoutingKey(HttpServletRequest request,
			@RequestBody List<CtrlDeviceRoutingServiceInfo> ctrlDeviceCmdExecReqRespList) throws Exception {

		logger.info("================ Insert Real Time Sensors Data ==============");

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		// 장비 수정
		deviceRoutingService.updateDeviceRoutingKey(ctrlDeviceCmdExecReqRespList);

		map.put("statusCode", Constant.HTTP_CREATE_CODE);
		map.put("httpStatus", Constant.HTTP_CREATE_STAT);

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, Constant.HTTP_CREATE_STAT);
	}

	// 라우팅 키 삭제
	@Operation(summary = "RoutingKey-Delete", description = "장비의 식별자와 코드네임을 통해 RoutingKey를 삭제한다.")
	@Parameters({
			@Parameter(name = "deviceIdentifier", required = false, description = "장비 식별자", in = ParameterIn.QUERY),
			@Parameter(name = "ctrlCmdExecCodeName", required = false, description = "코드 네임", in = ParameterIn.QUERY) })
	@DeleteMapping("/routing-key-out")
	public ResponseEntity<JSONObject> deleteRoutingKey(HttpServletRequest request,
			@RequestParam(required = false) String deviceIdentifier,
			@RequestParam(required = false) String ctrlCmdExecCodeName) throws Exception {

		logger.info("================ routing-key-out ==============");

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		if (deviceIdentifier != null) {
			map.put("deviceIdentifier", deviceIdentifier);
			map.put("ctrlCmdExecCodeName", ctrlCmdExecCodeName);
		}

		deviceRoutingService.deleteDeviceRoutingKey(map);

		map.clear();
		map.put("statusCode", Constant.HTTP_OK_CODE);
		map.put("httpStatus", Constant.HTTP_OK_STAT);

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, Constant.HTTP_CREATE_STAT);
	}

	// 커맨드 삭제
	@Operation(summary = "PTZ-Command-Delete", description = "respIdentifier를 통해 Command를 삭제한다.")
	@Parameters({
			@Parameter(name = "federatedTwinId", required = false, description = "federatedTwinId", in = ParameterIn.QUERY),
			@Parameter(name = "respIdentifier", required = false, description = "식별자", in = ParameterIn.QUERY), })
	@DeleteMapping("/ptz-command-out")
	public ResponseEntity<JSONObject> deleteReqCtrlCmd(HttpServletRequest request,
			@RequestParam(required = false) String federatedTwinId,
			@RequestParam(required = false) String respIdentifier) throws Exception {

		logger.info("================ ptz-command-out ==============");
		logger.info("federatedTwinId : {} ", federatedTwinId);
		logger.info("respIdentifier : {} ", respIdentifier);

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		if (federatedTwinId == null) {
			throw new Exception("******federatedTwinId is Null******");
		} else {
			map.put("federatedTwinId", federatedTwinId);
			if (respIdentifier != null) {
				map.put("respIdentifier", respIdentifier);
			}
		}

		ptzCommandService.deleteReqCtrlCmd(map);

		map.clear();
		map.put("statusCode", Constant.HTTP_OK_CODE);
		map.put("httpStatus", Constant.HTTP_OK_STAT);

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, Constant.HTTP_CREATE_STAT);
	}

	// 라우팅키 목록 조회
	@Operation(summary = "RoutingKey-List", description = "장비의 식별자와 코드네임을 통해 정보를 조회한다.")
	@Parameters({
			@Parameter(name = "deviceIdentifier", required = false, description = "장비 식별자", in = ParameterIn.QUERY),
			@Parameter(name = "ctrlCmdExecCodeName", required = false, description = "코드 네임", in = ParameterIn.QUERY) })
	@GetMapping("/routing-key-list")
	public ResponseEntity<JSONObject> getRoutingKeyList(HttpServletRequest request,
			@RequestParam(required = false) String deviceIdentifier,
			@RequestParam(required = false) String ctrlCmdExecCodeName) throws Exception {

		logger.info("================ getRoutingKeyList ==============");
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		if (deviceIdentifier != null) {
			map.put("deviceIdentifier", deviceIdentifier);
			map.put("ctrlCmdExecCodeName", ctrlCmdExecCodeName);
		}

		List<CtrlDeviceRoutingServiceInfo> ctrlDeviceRoutingServiceList = deviceRoutingService
				.getDeviceRoutingKeyList(map);

		map.clear();

		map.put("routingKeys", ctrlDeviceRoutingServiceList);
		map.put("totalCnt", ctrlDeviceRoutingServiceList.size());
		map.put("statusCode", Constant.HTTP_OK_CODE);
		map.put("httpStatus", Constant.HTTP_OK_STAT);

		JSONObject result = new JSONObject(map);

		return new ResponseEntity<>(result, httpHeaders, Constant.HTTP_OK_STAT);
	}

	// 제어 명령어 목록 조회
	@Operation(summary = "PTZ-Command-List", description = "federatedTwinId를 통해 정보를 조회한다.")
	@Parameters({
			@Parameter(name = "federatedTwinId", required = false, description = "federatedTwinId", in = ParameterIn.QUERY) })
	@GetMapping("/ptz-command-list")
	public ResponseEntity<JSONObject> getPTZCommandList(HttpServletRequest request,
			@RequestParam(required = false) String federatedTwinId) throws Exception {

		logger.info("================ getRoutingKeyList ==============");
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		if (federatedTwinId != null) {
			map.put("federatedTwinId", federatedTwinId);
		}

		List<HashMap<String, Object>> digitalTwinRequestCtrlCmdList = ptzCommandService.getReqCtrlCmdList(map);

		map.clear();

		map.put("ptzCommands", digitalTwinRequestCtrlCmdList);
		map.put("totalCnt", digitalTwinRequestCtrlCmdList.size());
		map.put("statusCode", Constant.HTTP_OK_CODE);
		map.put("httpStatus", Constant.HTTP_OK_STAT);

		JSONObject result = new JSONObject(map);

		return new ResponseEntity<>(result, httpHeaders, Constant.HTTP_OK_STAT);
	}

}
