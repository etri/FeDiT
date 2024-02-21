package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.service;
import org.springframework.cloud.openfeign.FeignClient;

@FeignClient("ControlCommandReceiver")
public interface CtrlCmdRcvServiceFeignClient {
	
//	@PostMapping("/msa/federated-digital-twins/{fdt_twin_id}/federated-digital-objects/{fdt_obj_id}")
//	public ResponseEntity<JSONObject> postReceiveRegisisteFtdObj(HttpServletRequest request,
//			@PathVariable("fdt_twin_id") String fdTwinId, @PathVariable("fdt_obj_id") String fdtObjId,
//			@RequestBody RegisterFdtObjVO regFdtObjVO);
	
}
