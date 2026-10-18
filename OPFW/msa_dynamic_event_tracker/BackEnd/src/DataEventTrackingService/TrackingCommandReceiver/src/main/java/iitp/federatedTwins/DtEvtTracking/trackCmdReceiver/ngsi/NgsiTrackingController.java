package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.ngsi;

import java.util.LinkedHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.service.TrackingCommandService;

@RestController
@RequestMapping("/api/tracking")
public class NgsiTrackingController {

	private static final Logger logger = LoggerFactory.getLogger(NgsiTrackingController.class);

	private final NgsiTrackingAssembler assembler;
	private final TrackingCommandService trackingCommandService;

	public NgsiTrackingController(NgsiTrackingAssembler assembler,
			TrackingCommandService trackingCommandService) {
		this.assembler = assembler;
		this.trackingCommandService = trackingCommandService;
	}

	@PostMapping("/commands")
	public ResponseEntity<?> postTrackingCommands(@RequestBody NgsiTrackingRequestVO request) {

		logger.info("================ postTrackingCommands ================");
		LinkedHashMap<String, Object> body = new LinkedHashMap<>();

		try {
			NgsiTrackingAssembler.Assembled assembled = assembler.assemble(request);
			LinkedHashMap<String, Object> saved = this.trackingCommandService
					.procRequestTrackingCommand(assembled.command);

			if (saved == null || saved.get("uuid-reqIdentifier") == null) {
				logger.error("tracking command save failed : {}", assembled.command.getReqIdentifier());
				body.put("error", "저장에 실패했습니다. 서버 로그를 확인하세요.");
				body.put("requestIdtifier", assembled.command.getReqIdentifier());
				return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
			}

			body.put("requestIdtifier", assembled.command.getReqIdentifier());
			body.put("uuid-reqIdentifier", saved.get("uuid-reqIdentifier"));
			body.put("processes", assembled.processes);
			return new ResponseEntity<>(body, HttpStatus.CREATED);

		} catch (IllegalArgumentException e) {
			logger.warn("contract violation : {}", e.getMessage());
			body.put("error", e.getMessage());
			return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);

		} catch (Exception e) {
			logger.error("Error Message : {}", e);
			body.put("error", e.getMessage());
			return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
