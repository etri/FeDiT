package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.controller;

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

import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.CtrlCmdPrdService;


@RestController
@RequestMapping("/fdt/msaoc/prd")
public class CtrlCmdPrdResController {

	private final CtrlCmdPrdService ctrlCmdPrdService;
	
	private final Logger logger = LoggerFactory.getLogger(CtrlCmdPrdResController.class);
	
	public CtrlCmdPrdResController(CtrlCmdPrdService ctrlCmdPrdService) {
		this.ctrlCmdPrdService = ctrlCmdPrdService;
	}
	
	@GetMapping("/ctrlCmd/taskProc")
    public ResponseEntity<JSONObject> executeTackProc(HttpServletRequest request) throws Exception {
		
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));

		HashMap<String, Object> map = new HashMap<>();
		HttpStatus resultSts = Constant.HTTP_OK_STAT;
		
		try {
			logger.info("requestControlCommandId : {}" , request.getParameter("requestControlCommandId"));
			logger.info("ctrlCmdSequenceId : {}" , request.getParameter("ctrlCmdSequenceId"));
			
			String requestControlCommandId = request.getParameter("requestControlCommandId");
			String ctrlCmdSequenceId = request.getParameter("ctrlCmdSequenceId");

			if(!"".equals(requestControlCommandId) && requestControlCommandId != null) {
				map.put("requestControlCommandId", requestControlCommandId);
			}
			
			if(!"".equals(ctrlCmdSequenceId) && ctrlCmdSequenceId != null) {
				map.put("ctrlCmdSequenceId", ctrlCmdSequenceId);
			}

			resultSts = ctrlCmdPrdService.executeTaskProc(map);
			
		} catch (Exception e) {
			resultSts = Constant.HTTP_SERVER_ERROR_STAT;
			logger.debug("resultSts : {}" , resultSts);
			logger.error("Error message : {}" , e);
		}

		return new ResponseEntity<>(httpHeaders, resultSts);		
	}
}
