package kr.co.n2m.platform.meta.schema.property.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import kr.co.n2m.platform.meta.schema.property.domain.PropertySearchVo;
import kr.co.n2m.platform.meta.schema.property.domain.PropertyVo;
import kr.co.n2m.platform.meta.schema.property.service.PropertyService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "메타데이터 프라퍼티", description = "메타데이터 프라퍼티 API")
@Slf4j
@RestController
public class PropertyController extends ResponseComponent {
	
	@Autowired
	private PropertyService propertyService;
	
	@Operation(summary="메타데이터 프라퍼티 목록 조회")
	@GetMapping("/api/v1/schema/properties")
	public ResponseEntity<Object> getPropertyList(PropertySearchVo searchVo) {
		return makeResponseEntity(propertyService.getPropertyList(searchVo));
	}

	@Operation(summary="메타데이터 프라퍼티 조회")
	@GetMapping("/api/v1/schema/properties/{prptyId}")
	public ResponseEntity<Object> getProperty(@Parameter(name="prptyId", description="프라퍼티ID") @PathVariable String prptyId) {
		return makeResponseEntity(propertyService.getProperty(prptyId));
	}
	
	/**
	 * 프라퍼티정보 프라퍼티정의 등록
	 */
	@Operation(summary="메타데이터 프라퍼티 생성")
	@PostMapping("/api/v1/schema/properties")
	public ResponseEntity<Object> createProperty(@RequestBody PropertyVo propertyVo) {
		String newId = propertyService.createProperty(propertyVo);
		return makeResponseEntity(new ResultIdVo(newId), HttpStatus.CREATED, "/api/v1/schema/properties/" + newId);
	}

	@Operation(summary="메타데이터 프라퍼티 수정")
	@PutMapping("/api/v1/schema/properties/{prptyId}/base")
	public ResponseEntity<Object> modifyProperty(@Parameter(name="prptyId", description="프라퍼티ID") @PathVariable String prptyId, @RequestBody PropertyVo propertyVo) {
		compareUniqueId(prptyId, propertyVo.getPrptyId());
		propertyService.modifyProperty(propertyVo);
		return makeResponseEntity(new ResultIdVo(prptyId));
	}
	
	@Operation(summary="메타데이터 프라퍼티 정의 변경")
	@PutMapping("/api/v1/schema/properties/{prptyId}/define")
	public ResponseEntity<Object> modifyPropertyDefine(@Parameter(name="prptyId", description="프라퍼티ID") @PathVariable String prptyId, @RequestBody PropertyVo propertyVo) {
		compareUniqueId(prptyId, propertyVo.getPrptyId());
		propertyService.modifyPropertyDefine(propertyVo);
		return makeResponseEntity(new ResultIdVo(prptyId));
	}
	
	@Operation(summary="메타데이터 프라퍼티 중복체크")
	@GetMapping("/api/v1/schema/properties/check")
	public ResponseEntity<Object> getModelCheck(String prptyNm) {
		Map<String, Boolean> resMap = new  HashMap<>();
		resMap = propertyService.getPropertyNameCheck(prptyNm);
		return makeResponseEntity(resMap);
	}
	
	@Operation(summary="메타데이터 유형 프라퍼티 목록 조회")
	@GetMapping("/api/v1/schema/typeproperties/{modelId}")
	public ResponseEntity<Object> getTypePropertyList(@Parameter(name="modelId", description="모델ID") @PathVariable String modelId, ModelPropertySearchVo searchVo) {
		searchVo.setModelId(modelId);
		return makeResponseEntity(propertyService.getTypePropertyList(searchVo));
	}
}
