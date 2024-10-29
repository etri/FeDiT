package kr.co.n2m.platform.meta.schema.modelproperty.controller;

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
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertySearchVo;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyVo;
import kr.co.n2m.platform.meta.schema.modelproperty.service.ModelPropertylService;

@Tag(name = "메타데이터 모델 프라퍼티", description = "메타데이터 모델 프라퍼티 API")
@RestController
public class ModelPropertyController extends ResponseComponent {
	
	@Autowired
	private ModelPropertylService modelPropertyService;
	
	@Operation(summary="메타데이터 모델 프라퍼티 검색")
	@GetMapping("/api/v1/schema/models/{modelId}/properties")
	public ResponseEntity<Object> getModelPropertyList(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId, ModelPropertySearchVo searchVo) {
		searchVo.setModelId(modelId);
		return makeResponseEntity(modelPropertyService.getModelPropertyList(searchVo));
	}
	
	@Operation(summary="메타데이터 유형 모델 프라퍼티 목록")
	@GetMapping("/api/v1/schema/typemodels/{modelId}/properties")
	public ResponseEntity<Object> getTypeModelPropertyList(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId, ModelPropertySearchVo searchVo) {
		searchVo.setModelId(modelId);
		return makeResponseEntity(modelPropertyService.getTypeModelPropertyList(searchVo));
	}

	@Operation(summary="메타데이터 유형 모델 프라퍼티 등록 (Multi)")
	@PostMapping("/api/v1/schema/typemodels/{modelId}/properties")
	public ResponseEntity<Object> createTypeModelProperty(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId, @RequestBody List<ModelPropertyVo> list) {
		Map<String, Object> resultMap = modelPropertyService.createModelProperty(modelId, list, "type");
		return makeResponseEntity(resultMap, HttpStatus.CREATED, "typemodels/"+modelId+"/properties");
	}
	
	@Operation(summary="메타데이터 유형 모델 프라퍼티 수정 (Multi)")
	@PutMapping("/api/v1/schema/typemodels/{modelId}/properties")
	public ResponseEntity<Object> modifyTypeModelProperty(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId, @RequestBody List<ModelPropertyVo> list) {
		compareUniqueId(modelId, list.get(0).getModelId());
		modelPropertyService.modifyModelProperty(list);
//		return makeResponseEntity(new ResultIdVo(modelId));
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	@Operation(summary="메타데이터 유형 모델 프라퍼티 삭제 (Multi)")
	@DeleteMapping("/api/v1/schema/typemodels/{modelId}/properties")
	public ResponseEntity<Object> deleteTypeModelProperty(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId, @RequestBody List<ModelPropertyVo> deleteList) {
		return makeResponseEntity(modelPropertyService.deleteModelProperty(modelId, deleteList));
	}
	
	@Operation(summary="메타데이터 표준 모델 프라퍼티 목록")
	@GetMapping("/api/v1/schema/stdmodels/{modelId}/properties")
	public ResponseEntity<Object> getStdModelPropertyList(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId, ModelPropertySearchVo searchVo) {
		searchVo.setModelId(modelId);
		return makeResponseEntity(modelPropertyService.getTypeModelPropertyList(searchVo));
	}

	@Operation(summary="메타데이터 표준 모델 프라퍼티 등록 (Multi)")
	@PostMapping("/api/v1/schema/stdmodels/{modelId}/properties")
	public ResponseEntity<Object> createStdModelProperty(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId, @RequestBody List<ModelPropertyVo> list) {
		Map<String, Object> resultMap = modelPropertyService.createModelProperty(modelId, list, "std");
		return makeResponseEntity(resultMap, HttpStatus.CREATED, "stdmodels/#{modelId}/properties");
	}
	
	@Operation(summary="메타데이터 표준 모델 프라퍼티 수정 (Multi)")
	@PutMapping("/api/v1/schema/stdmodels/{modelId}/properties")
	public ResponseEntity<Object> modifyStdModelProperty(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId, @RequestBody List<ModelPropertyVo> list) {
		compareUniqueId(modelId, list.get(0).getModelId());
		modelPropertyService.modifyModelProperty(list);
//		return makeResponseEntity(new ResultIdVo(modelId));
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	@Operation(summary="메타데이터 표준 모델 프라퍼티 삭제 (Multi)")
	@DeleteMapping("/api/v1/schema/stdmodels/{modelId}/properties")
	public ResponseEntity<Object> deleteStdModelProperty(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId, @RequestBody List<ModelPropertyVo> list) {
		return makeResponseEntity(modelPropertyService.deleteModelProperty(modelId, list));
	}
}
