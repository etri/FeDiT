package kr.co.n2m.platform.meta.resource.agent.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.resource.agent.domain.AgentSearchVo;
import kr.co.n2m.platform.meta.resource.agent.domain.AgentVo;
import kr.co.n2m.platform.meta.resource.agent.service.AgentService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "대리인", description = "대리인 관리 API")
@Slf4j
@RestController
public class AgentController extends ResponseComponent {
		
	/* -------------------------------------
	 * 2023-07-27 정형모델 사용안함
	 * Agent : 정형 모델에서 비정형 모델로 변경. MetadataSetController 이용. 여기는 사용 되면 안됨!
	 --------------------------------------- */	
	
//	@Autowired
//	private AgentService agentService;
//
//	/** 대리인 관리 페이징 목록 조회 */
//	@Operation(summary="대리인 관리 페이징 목록 조회")
//	@GetMapping("/api/v1/resource/agents")
//	public ResponseEntity<Object> getAgentList(AgentSearchVo searchVo) {
//		
//		log.debug(searchVo.toString());
//		return makeResponseEntity(agentService.getAgentList(searchVo));
//	}
//	
//	/** 대리인 상세 조회 */
//	@Operation(summary="대리인 상세 조회")
//	@GetMapping("/api/v1/resource/agents/{agntId}")
//	public ResponseEntity<Object> getAgent(
//			@Parameter(name="agntId", description="대리인ID") @PathVariable String agntId) {
//
//		AgentVo vo = agentService.getAgent(agntId);
//		if (vo == null) throw new ResNotFoundException("대리인 데이터가 존재하지 않습니다.");
//		
//		return makeResponseEntity(vo);
//	}
//	
//	/** 대리인 등록 */
//	@Operation(summary="대리인 등록")
//	@PostMapping("/api/v1/resource/agents")
//	public ResponseEntity<Object> createAgent(@RequestBody AgentVo agentVo) {
//		
//		log.debug(agentVo.toString());
//		String newId = agentService.createAgent(agentVo);
//		
//		return makeResponseEntity(new ResultIdVo(newId), HttpStatus.CREATED, "/api/v1/resource/agents/" + newId);
//	}
//	
//	/** 대리인 수정 */
//	@Operation(summary="대리인 수정")
//	@PutMapping("/api/v1/resource/agents/{agntId}")
//	public ResponseEntity<Object> modifyAgent(
//			@Parameter(name="agntId", description="대리인ID") @PathVariable String agntId, @RequestBody AgentVo agentVo) {
//		
//		log.debug(agentVo.toString());
//		compareUniqueId(agntId, agentVo.getAgntId());
//		agentService.modifyAgent(agentVo);
//		return makeResponseEntity(new ResultIdVo(agntId));
//	}
//	
//	/** 대리인 삭제 */
//	@Operation(summary="대리인 삭제")
//	@DeleteMapping("/api/v1/resource/agents/{agntId}")
//	public ResponseEntity<Object> deleteAgent(@PathVariable String agntId) {
//		
//		agentService.deleteAgent(agntId);
//		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
//	}
	
}
