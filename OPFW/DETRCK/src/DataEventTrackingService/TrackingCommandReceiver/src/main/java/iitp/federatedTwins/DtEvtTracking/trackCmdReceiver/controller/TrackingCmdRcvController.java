package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.controller;

import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.parser.TrackingCmdValidator;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.service.TrackingCommandService;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.RegisterFdtObjVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingSequencesVO;

@RestController
@RequestMapping("/fdt/detrck/rcv")
public class TrackingCmdRcvController {

	@Autowired
	TrackingCmdValidator ctrlCmdValidator;

	private final TrackingCommandService trackingCommandService;

	private final Logger logger = LoggerFactory.getLogger(TrackingCmdRcvController.class);

	public TrackingCmdRcvController(TrackingCommandService trackingCommandService) {
		this.trackingCommandService = trackingCommandService;
	}

	@PostMapping("/{fdt_twin_id}/federated-digital-objects/{fdt_obj_id}")
	public ResponseEntity<JSONObject> postReceiveRegisisteFtdObj(HttpServletRequest request,
			@PathVariable("fdt_twin_id") String fdTwinId, @PathVariable("fdt_obj_id") String fdtObjId,
			@RequestBody RegisterFdtObjVO regFdtObjVO) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		HttpStatus resultSts = Constant.HTTP_CREATE_STAT;

		logger.info("================ postReceiveRegisisteFtdObj ================");

		try {
			TrackingCommandVO trackingCommand = new TrackingCommandVO();
			trackingCommand.setReqCtrlCmdType(Constant.CTRL_CMD_REQ_TYPE_REG_DV);
			trackingCommand.setReqIdentifier(regFdtObjVO.getRequestIdtifier());
			trackingCommand.setCallBackURL(regFdtObjVO.getCallBackURL());

			ctrlCmdValidator.valideteDefalutTrackingCmd(trackingCommand);

			TrackingSequencesVO trackingSequences = new TrackingSequencesVO();
			trackingSequences.setFederatedTwinId(fdTwinId);
			trackingSequences.setFederatedDigitalObjectId(fdtObjId);
			trackingSequences.setDigitalTwinId(regFdtObjVO.getDigitalTwinId());
			trackingSequences.setDigitalObjId(regFdtObjVO.getDigitalObjId());
			trackingSequences.setDigitalControlId(regFdtObjVO.getControlId());
			

			TrackingSequencesVO[] trackingSequenceArr = { trackingSequences };
			trackingCommand.setTrckProcInfo(trackingSequenceArr);
			
			resultSts = this.trackingCommandService.procRequestRegisteFdtObjData(trackingCommand);	


		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
		}

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, resultSts);
	}

	
	@PostMapping("/control-commands")
	public ResponseEntity<JSONObject> postReceiveControlCommands(HttpServletRequest request,
			@RequestBody TrackingCommandVO trackingCommand) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		HttpStatus resultSts = Constant.HTTP_CREATE_STAT;
		logger.info("================ postReceiveControlCommands ================");

		
		try {
			trackingCommand.setReqCtrlCmdType(Constant.CTRL_CMD_REQ_TYPE_CTRL_DV);
			
			// 파라메터 Validation 처리
			trackingCommand = ctrlCmdValidator.valideteTrackingCommands(trackingCommand);
			logger.info("================ procRequestControlCommand ================");
			resultSts = this.trackingCommandService.procRequestTrackingCommand(trackingCommand);			
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
		}
		
		
		return new ResponseEntity<>(new JSONObject(map), httpHeaders, resultSts);
	}

}
