package kr.co.n2m.platform.meta.schema.model.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfModelReqVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.service.VirtuosoService;
import kr.co.n2m.platform.meta.schema.model.domain.ModelApiDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelSearchVo;
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
import kr.co.n2m.platform.meta.schema.model.service.ModelService;

@Tag(name = "메타데이터 모델", description = "메타데이터 모델 API")
@RestController
public class ModelController extends ResponseComponent {
	
	@Autowired
	private ModelService modelService;
	
	@Autowired
	VirtuosoService virtuosoService;
	
	@Operation(summary="메타데이터 모델 검색")
	@GetMapping("/api/v1/schema/models")
	public ResponseEntity<Object> getModelList(ModelSearchVo searchVo) {
		return makeResponseEntity(modelService.getModelList(searchVo));
	}
	
	@Operation(summary="메타데이터 모델 트리 조회")
	@GetMapping("/api/v1/schema/models/tree")
	public ResponseEntity<Object> getModelTree(ModelSearchVo searchVo) {
		return makeResponseEntity(modelService.getModelTree(searchVo));
	}

	@Operation(summary="메타데이터 모델 상세 조회")
	@GetMapping("/api/v1/schema/models/{modelId}")
	public ResponseEntity<Object> getModel(
			@Parameter(name="modelId", description="모델ID") @PathVariable String modelId) {
		
		ModelVo vo = modelService.getModel(modelId);
		if (vo == null) throw new ResNotFoundException("모델이 존재하지 않습니다.");
		
		return makeResponseEntity(vo);
	}
	
	@Operation(summary="메타데이터 모델 정보 조회 (외부 API용)")
	@GetMapping("/api/v1/schema/models/{metaModel}/info")
	public ResponseEntity<Object> getApiModelInfoByModelNm(@Parameter(name="metaModel", description="모델 명") @PathVariable String metaModel) {
		
		ModelApiDto apiDto = modelService.getApiModelInfoByModelNm(metaModel);
		return makeResponseEntity(apiDto);
	}	
	
	@Operation(summary="메타데이터 모델을 RDF 모델로 변환된 문자열 조회 (RDF 확인)")
	@GetMapping("/api/v1/schema/models/{modelId}/rdf")
	public ResponseEntity<Object> getRdfModelStr(@Parameter(name="modelId", description="모델 ID") @PathVariable String modelId, RdfModelReqVo rdfModelReqVo) {
		rdfModelReqVo.setModelId(modelId);
		
		Map<String, String> resMap = new HashMap<>();
    	resMap.put("rdfStr", virtuosoService.getRdfModelStr(rdfModelReqVo));
        return makeResponseEntity(resMap);
	}	
	
	@Operation(summary="메타데이터 모델 중복체크")
	@GetMapping("/api/v1/schema/models/check")
	public ResponseEntity<Object> getModelCheck(
		String searchMode, String searchName, @RequestParam(required=false) String modelId) {
		
		Map<String, Boolean> resMap = new  HashMap<>();
		if(searchMode.equals("modelName")) {
			resMap = modelService.getModelNameCheck(searchName);
		} else {
			resMap = modelService.getModelUriCheck(searchName, modelId);
		}
		return makeResponseEntity(resMap);
	}
	
}
