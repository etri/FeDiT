package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.controller;

import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;

import org.apache.kafka.clients.consumer.KafkaConsumer;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.parser.CtrlCmdValidator;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.parser.CtrlCmdValidatorParser;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.service.ControlCommandService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.ControlCommandVO;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.CtrlSequencesVO;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.RegisterFdtObjVO;

/**
 * @파일명 : CtrlCmdRcvController.java
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @변경이력 :
 * @description :
 */
@RestController
@RequestMapping("/fdt/msaoc/rcv")
public class CtrlCmdRcvController {

	@Autowired
	ApplicationContext ctx;

	@Autowired
	CtrlCmdValidator ctrlCmdValidator;

	@Autowired
	CtrlCmdValidatorParser ctrlCmdValidatorParser;

	private final ControlCommandService controlCommandService;

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdRcvController.class);

	public CtrlCmdRcvController(ControlCommandService controlCommandService) {
		this.controlCommandService = controlCommandService;
	}

	/**
	 * @title : 3.3.2 디바이스 등록/관리 인터페이스
	 * @작성일 : 2023. 07. 20.
	 * @작성자 : 오세광
	 * @requestMapping : POST
	 * @method : postReceiveRegisisteFtdObj
	 * @queryString :
	 * @return : ResponseEntity<JSONObject>
	 * @description :
	 */
	@PostMapping("/federated-digital-twins/{fdt_twin_id}/federated-digital-objects/{fdt_obj_id}")
	public ResponseEntity<JSONObject> postReceiveRegisisteFtdObj(HttpServletRequest request,
			@PathVariable("fdt_twin_id") String fdTwinId, @PathVariable("fdt_obj_id") String fdtObjId,
			@RequestBody RegisterFdtObjVO regFdtObjVO) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();
		HashMap<String,Object> ctrlConditionData = new HashMap<>();

		HttpStatus resultSts = Constant.HTTP_CREATE_STAT;

		logger.info("================ postReceiveRegisisteFtdObj ================");

		try {
			ControlCommandVO controlCommand = new ControlCommandVO();
			controlCommand.setReqCtrlCmdType(Constant.CTRL_CMD_REQ_TYPE_REG_DV);
			controlCommand.setRequestIdtifier(regFdtObjVO.getRequestIdtifier());
			controlCommand.setCallBackURL(regFdtObjVO.getCallBackURL());

			// 파라메터 Validation 처리
			ctrlCmdValidator.valideteDefalutCtrlCmd(controlCommand);



			// controlCommand 파라메터 Validation 처리
			String ctrlCommand = regFdtObjVO.getControlCommand();
			ctrlCmdValidatorParser.ctrlCommandValidator(ctrlCommand);


			// ctrlCondition 파라메터 Validation 처리
			String ctrlCondition = regFdtObjVO.getCtrlCondition();
			ctrlConditionData = ctrlCmdValidatorParser.ctrlConditionValidator(ctrlCondition);



			// sequence 데이터 셋팅
			CtrlSequencesVO ctrlSequence = new CtrlSequencesVO();
			if(ctrlConditionData != null) {
				logger.debug("data : {}" , ctrlConditionData.get("data"));
				logger.debug("res : {}" , ctrlConditionData.get("res"));
				if((boolean) ctrlConditionData.get("res") == true) {
					ctrlSequence.setLogicalExpression((String) ctrlConditionData.get("data"));
				}
			}


			ctrlSequence.setControlIdtifier(regFdtObjVO.getControlIdtifier());
			ctrlSequence.setFederatedTwinId(fdTwinId);
			ctrlSequence.setFederatedDigitalObjectId(fdtObjId);
			ctrlSequence.setDigitalTwinId(regFdtObjVO.getDigitalTwinId());
			ctrlSequence.setDigitalObjId(regFdtObjVO.getDigitalObjId());
			ctrlSequence.setDigitalControlId(regFdtObjVO.getDigitalControlId());
			ctrlSequence.setControlCommand(regFdtObjVO.getControlCommand());
			ctrlSequence.setCtrlCondition(regFdtObjVO.getCtrlCondition());
			ctrlSequence.setStart_interval(100);


			// seqeunce 파라메터 Validation 처리
			ctrlCmdValidator.valideteDefalutCtrlSequence(ctrlSequence);

			// 데이터 등록 처리 작업 진행
			CtrlSequencesVO[] ctrlSequenceArr = { ctrlSequence };
			controlCommand.setCtrlSequences(ctrlSequenceArr);

			/*TODO
			 	추후에 레포지토리에 연합트윈 정보, 단일트윈 정보 메타 정보를 가지고 와서 장비정보로 등록되어 있는지 확인하는 절차를 진행해야 한다.
			 	2세부에 보내서 그냥 전송이 안되면 오류로 하면 안되나???			  
			 */


			// 등록처리			
			resultSts = this.controlCommandService.procRequestRegisteFdtObjData(controlCommand);		

		} catch (Exception e) {
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
			logger.debug("resultSts : {} " , resultSts);
			logger.error("Error Message : {} " , e);
		}

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, resultSts);
	}	

	/**
	 * @title : 3.3.3 디바이스 제어요청
	 * @작성일 : 2023. 07. 20.
	 * @작성자 : 오세광
	 * @requestMapping : POST
	 * @method : postReceiveControlCommands
	 * @queryString :
	 * @return : ResponseEntity<JSONObject>
	 * @description :
	 *
	 */
	@PostMapping("/control-commands")
	public ResponseEntity<JSONObject> postReceiveControlCommands(HttpServletRequest request,
			@RequestBody ControlCommandVO controlCommand) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		HttpStatus resultSts = Constant.HTTP_CREATE_STAT;

		logger.info("================ postReceiveControlCommands ================");

		try {
			controlCommand.setReqCtrlCmdType(Constant.CTRL_CMD_REQ_TYPE_CTRL_DV);

			controlCommand = ctrlCmdValidator.valideteControlCommands(controlCommand);
			logger.info("================ procRequestControlCommand ================");

			resultSts = this.controlCommandService.procRequestControlCommand(controlCommand);			
		} catch (Exception e) {
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
			logger.debug("resultSts : {} " , resultSts);
			logger.error("Error Message : {} " , e);
		}

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, resultSts);
	}



	@GetMapping("/getTopic")
	public ResponseEntity<JSONObject> getTopic(HttpServletRequest request
			, @RequestParam String topic) throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();

		HttpStatus resultSts = Constant.HTTP_CREATE_STAT;

		logger.info("================ postReceiveControlCommands ================>> "+topic);

		try {
			logger.info("================ postReceiveControlCommands ================");

			ctx.getBean(KafkaConsumer.class, String.valueOf(System.currentTimeMillis()), topic, "to23");

		} catch (Exception e) {
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
			logger.debug("resultSts : {} " , resultSts);
			logger.error("Error Message : {} " , e);
		}

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, resultSts);
	}
}
