package kr.co.n2m.platform.meta.rdf.mapping.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingModelSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingModelVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleDto;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingTreeVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingVo;
import kr.co.n2m.platform.meta.rdf.mapping.service.RdfMappingRuleService;
import kr.co.n2m.platform.meta.rdf.mapping.service.RdfMappingService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "RDF 매핑", description = "RDF 매핑 API")
@Slf4j
@RestController
public class RdfMappingController extends ResponseComponent {

	@Autowired
	private RdfMappingService rdfMappingService;
	@Autowired
	private RdfMappingRuleService rdfMappingRuleService;
	
	/** RDF 매핑 목록 조회 */
	@Operation(summary="RDF 매핑 목록 조회")
	@GetMapping("/api/v1/rdf/mappings")
	public ResponseEntity<Object> getMappingStatusList(RdfMappingSearchVo searchVo) {
		return makeResponseEntity(rdfMappingService.getMappingStatusList(searchVo));
	}
	
	/** RDF 매핑 등록 */
	@Operation(summary="RDF 매핑 등록")
	@PostMapping("/api/v1/rdf/mappings")
	public ResponseEntity<Object> createMappings(@RequestBody RdfMappingVo rdfMappingVo) {
		
		log.debug(rdfMappingVo.toString());
		String result = rdfMappingService.createMapping(rdfMappingVo);	
		return makeResponseEntity(new ResultIdVo(result), HttpStatus.CREATED, "/api/v1/rdf/mappings/" + result);
	}
	
	/** RDF 매핑 상세 조회 */
	@Operation(summary="RDF 매핑 관리 상세 조회")
	@GetMapping("/api/v1/rdf/mappings/{rdfMappgId}")	
	public ResponseEntity<Object> getMapping(
			@Parameter(name="rdfMappgId", description="RDF 매핑 ID") @PathVariable String rdfMappgId) {
		
		RdfMappingVo vo = rdfMappingService.getRdfMapping(rdfMappgId);
		if (vo == null) throw new ResNotFoundException("RDF 매핑 데이터가 존재하지 않습니다.");

		return makeResponseEntity(vo);
	}
	
	/** RDF 매핑 모델 목록 조회 */
	@Operation(summary="RDF 매핑 모델 목록 조회")
	@GetMapping("/api/v1/rdf/mappingmodels")
	public ResponseEntity<Object> getMappingModelList(RdfMappingModelSearchVo searchVo) {
		return makeResponseEntity(rdfMappingService.getMappingModelList(searchVo));
	}
	
	/** RDF 매핑 모델 등록 */
	@Operation(summary="RDF 매핑 모델 등록")
	@PostMapping("/api/v1/rdf/mappingmodels")
	public ResponseEntity<Object> createMappings(@RequestBody RdfMappingModelVo rdfMappingModelVo) {
		
		log.debug(rdfMappingModelVo.toString());
		String result = rdfMappingService.createMappingModel(rdfMappingModelVo);	
		return makeResponseEntity(new ResultIdVo(result), HttpStatus.CREATED, "/api/v1/rdf/mappingmodels/" + result);
	}
	
	/** RDF 매핑 모델 수정 */
	@Operation(summary="RDF 매핑 모델 수정")
	@PutMapping("/api/v1/rdf/mappingmodels/{rdfMappgModelId}")
	public ResponseEntity<Object> modifyMappingModels(
			@Parameter(name="rdfMappgModelId", description="RDF 매핑 모델 ID") @PathVariable String rdfMappgModelId, @RequestBody RdfMappingModelVo rdfMappingModelVo) {
		
		log.debug(rdfMappingModelVo.toString());
		compareUniqueId(rdfMappgModelId, rdfMappingModelVo.getRdfMappgModelId());
		rdfMappingService.modifyMappingModel(rdfMappingModelVo);
		return makeResponseEntity(new ResultIdVo(rdfMappingModelVo.getRdfMappgModelId()));
	}
	
	/** RDF 매핑 모델 삭제 */
	@Operation(summary="RDF 매핑 모델 삭제")
	@DeleteMapping("/api/v1/rdf/mappingmodels/{rdfMappgModelId}")
	public ResponseEntity<Object> deleteMappingModels(@PathVariable String rdfMappgModelId) {
		
		rdfMappingService.deleteMappingModel(rdfMappgModelId);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/** RDF 매핑 tree 목록 조회 */
	@Operation(summary="RDF 매핑 tree 목록 조회")
	@GetMapping("/api/v1/rdf/mappingmodels/{rdfMappgModelId}/tree")
	public ResponseEntity<Object> getMappingTreeListByRdfModelId(
			@Parameter(name="rdfMappgModelId", description="RDF 매핑 모델 ID") @PathVariable String rdfMappgModelId) {
		
		Map<String, List<RdfMappingTreeVo>> resMap = new HashMap<>();
		resMap.put("list", rdfMappingService.getMappingTreeListByRdfModelId(rdfMappgModelId));
		return makeResponseEntity(resMap);
	}
	
	/** RDF 매핑 규칙 생성 */
	@Operation(summary="RDF 매핑 규칙 생성")
	@PostMapping("/api/v1/rdf/mappingrules")
	public ResponseEntity<Object> createMappingrule(@RequestBody RdfMappingRuleVo rdfMappingRuleVo) {
		
		rdfMappingRuleService.createMappingrule(rdfMappingRuleVo);
		return makeResponseEntity(new ResultIdVo(rdfMappingRuleVo.getRdfMappgRuleId()));
	}
	
	/** RDF 매핑 규칙 수정 */
	@Operation(summary="RDF 매핑 규칙 수정")
	@PutMapping("/api/v1/rdf/mappingrules/{rdfMappgRuleId}")
	public ResponseEntity<Object> modifyMappingrule(
			@Parameter(name="rdfMappgRuleId", description="RDF 매핑 규칙 ID") @PathVariable String rdfMappgRuleId, @RequestBody RdfMappingRuleDto rdfMappingRuleDto) {
		
		log.debug(rdfMappingRuleDto.toString());
		compareUniqueId(rdfMappgRuleId, rdfMappingRuleDto.getRdfMappgRuleId());
		rdfMappingRuleService.modifyMappingrule(rdfMappingRuleDto);
		return makeResponseEntity(new ResultIdVo(rdfMappingRuleDto.getRdfMappgRuleId()));
	}
	
	/** RDF 매핑 규칙 삭제 */
	@Operation(summary="RDF 매핑 규칙 삭제")
	@DeleteMapping("/api/v1/rdf/mappingrules/{rdfMappgRuleId}")
	public ResponseEntity<Object> deleteMappingrule(@PathVariable String rdfMappgRuleId) {
		
		rdfMappingRuleService.deleteMappingrule(rdfMappgRuleId);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/** RDF 매핑 수정 */
	@Operation(summary="RDF 매핑 수정")
	@PutMapping("/api/v1/rdf/mappings/{rdfMappgId}")
	public ResponseEntity<Object> modifyMappings(
			@Parameter(name="rdfMappgId", description="RDF 매핑 ID") @PathVariable String rdfMappgId, @RequestBody RdfMappingVo rdfMappingVo) {
		
		log.debug(rdfMappingVo.toString());
		compareUniqueId(rdfMappgId, rdfMappingVo.getRdfMappgId());
		rdfMappingService.modifyMapping(rdfMappingVo);
		return makeResponseEntity(new ResultIdVo(rdfMappingVo.getRdfMappgId()));
	}
	
	/** RDF 매핑 삭제 (modify) (상태코드 변경) */
	@Operation(summary="RDF 매핑 삭제 (상태코드 변경)")
	@DeleteMapping("/api/v1/rdf/mappings/{rdfMappgId}")
	public ResponseEntity<Object> deleteMappings(@PathVariable String rdfMappgId) {
		
		rdfMappingService.deleteMapping(rdfMappgId);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
}
