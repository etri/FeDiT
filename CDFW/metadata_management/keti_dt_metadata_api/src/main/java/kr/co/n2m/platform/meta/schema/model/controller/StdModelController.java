package kr.co.n2m.platform.meta.schema.model.controller;

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
import kr.co.n2m.platform.meta.schema.model.domain.ModelSearchVo;
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
import kr.co.n2m.platform.meta.schema.model.service.StdModelService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "메타데이터 표준 모델", description = "메타데이터 표준 모델 API")
@Slf4j
@RestController
public class StdModelController extends ResponseComponent {
	
	@Autowired
	private StdModelService stdModelService;
	
	@Operation(summary="표준 모델 목록 조회")
	@GetMapping("/api/v1/schema/stdmodels")
	public ResponseEntity<Object> getStdList(ModelSearchVo searchVo) {
		return makeResponseEntity(stdModelService.getStdModelList(searchVo));
	}
	
	@Operation(summary="표준 모델 조회")
	@GetMapping("/api/v1/schema/stdmodels/{modelId}")
	public ResponseEntity<Object> getStdModel(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId) {
		return makeResponseEntity(stdModelService.getStdModel(modelId));
	}
	
	@Operation(summary="표준 모델 등록")
	@PostMapping("/api/v1/schema/stdmodels")
	public ResponseEntity<Object> createStdModel(@RequestBody ModelVo modelVo) {
		String newId = stdModelService.createStdModel(modelVo);
		return makeResponseEntity(new ResultIdVo(newId), HttpStatus.CREATED, "/api/v1/schema/stdmodels" + newId);
	}
	
	@Operation(summary="표준 모델 수정")
	@PutMapping("/api/v1/schema/stdmodels/{modelId}")
	public ResponseEntity<Object> modifyStdModel(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId, @RequestBody ModelVo modelVo) {
		compareUniqueId(modelId, modelVo.getModelId());
		stdModelService.modifyStdModel(modelVo);
		return makeResponseEntity(new ResultIdVo(modelId));
	}
	
	@Operation(summary="표준 모델 삭제")
	@DeleteMapping("/api/v1/schema/stdmodels/{modelId}")
	public ResponseEntity<Object> deleteStdModel(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId) {
		stdModelService.deleteStdModel(modelId);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
}
