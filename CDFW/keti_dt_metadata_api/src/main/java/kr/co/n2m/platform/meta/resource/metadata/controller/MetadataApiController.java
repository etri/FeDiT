package kr.co.n2m.platform.meta.resource.metadata.controller;

import java.util.List;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataApiSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetVo;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataApiService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "메타데이터 (외부 API용)", description = "메타데이터 관리 API (외부 API용)")
@Slf4j
@RestController
public class MetadataApiController extends ResponseComponent {
	
	@Autowired
	MetadataApiService metadataApiService;
	
	/**
	 * 유형 모델별 메타데이터 셋 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 16.
	 * @param dataUri
	 * @return
	 */
	@Operation(summary="유형 모델별 메타데이터 셋 목록 조회 - TODO GeoJson 검색 조건 정의 필요할 수 있음"
			, description="배열로 정의된 프라퍼티인 경우 값이 10건 이하로만 조회됨. " +
			  "<br />해당 프라퍼티를 10건 이상 조회하고 싶은 경우. 다른 API 를 사용하여 조회해야 함. " +
			  "<br />ex)/api/v1/resource//{dataUri}/{medataSetId}/properties/{prptyNm}")
	@GetMapping("/api/v1/resource/{dataUri}")	
	public ResponseEntity<Object> getDataMapListByDataUri(@PathVariable String dataUri, MetadataApiSearchVo metadataApiSearchVo) {
		log.debug("{}", metadataApiSearchVo);
		SearchResultListVo listVo = metadataApiService.getDataMapListByDataUri(dataUri, metadataApiSearchVo);
		return makeResponseEntity(listVo);
	}

	/**
	 * 유형 모델별 메타데이터 셋 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 15.
	 * @param dataUri
	 * @param medataSetId
	 * @return
	 */
	@Operation(summary="유형 모델별 메타데이터 셋 조회")
	@GetMapping("/api/v1/resource/{dataUri}/{medataSetId}")	
	public ResponseEntity<Object> getDataMapFromMetadataSet(@PathVariable String dataUri, @PathVariable String medataSetId,
			@RequestParam(name="arrayDataLimitYn", required=false) @Parameter(name = "arrayDataLimitYn", description="배열 데이터 조회 제한 여부", example="Y", required=false) String arrayDataLimitYn,
			@RequestParam(name="arrayDataLimit", required=false) @Parameter(description="배열 데이터 조회 기본 건수", example="50", required=false) Integer arrayDataLimit) {
		ListOrderedMap<String, Object> dataMap = metadataApiService.getDataMapByDataUri(dataUri, medataSetId, arrayDataLimitYn, arrayDataLimit);
		if (dataMap == null) throw new ResNotFoundException();
		return makeResponseEntity(dataMap);
	}	
	
	/**
	 * 유형 모델별 메타데이터 셋 생성 (Multi) - 메타데이터셋 등록 (Multi)
	 * @Author      : heenim
	 * @Date        : 2023. 05. 15.
	 * @param dataUri
	 * @param paramList
	 * @return
	 */
	@Operation(summary="유형 모델별 메타데이터 셋 생성 (Multi)")
	@PostMapping("/api/v1/resource/{dataUri}")	
	public ResponseEntity<Object> createMetadataSetByDataUri(@PathVariable String dataUri, @RequestBody List<ListOrderedMap<String, Object>> paramList) {
		log.debug("dataUri : {}", dataUri);
		
		int c = 0;
		for (ListOrderedMap<String, Object> paramMap : paramList) {
			log.debug("paramMap [{}] : {}", c++, paramMap);
		}
		
		return makeResponseEntity(metadataApiService.createMetadataSetByDataUri(dataUri, paramList), HttpStatus.CREATED);		
	}	

	/**
	 * 유형 모델별 메타데이터 셋 수정
	 * @Author      : heenim
	 * @Date        : 2023. 09. 05.
	 * @param dataUri
	 * @param medataSetId
	 * @param dataMap
	 * @return
	 */
	@Operation(summary="유형 모델별 메타데이터 셋 수정")
	@PutMapping("/api/v1/resource/{dataUri}/{medataSetId}")	
	public ResponseEntity<Object> modifyMetadataSetByDataUri(@PathVariable String dataUri, @PathVariable String medataSetId, @RequestBody ListOrderedMap<String, Object> dataMap) {
		metadataApiService.modifyMetadataSetByDataUri(dataUri, medataSetId, dataMap);
		return makeResponseEntity(new ResultIdVo(medataSetId));
	}
	
	/**
	 * 유형 모델별 메타데이터 셋 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 06. 02.
	 * @param dataUri
	 * @param medataSetId
	 * @return
	 */
	@Operation(summary="유형 모델별 메타데이터 셋 삭제")
	@DeleteMapping("/api/v1/resource/{dataUri}/{medataSetId}")	
	public ResponseEntity<Object> deleteMetadataSetByDataUri(@PathVariable String dataUri, @PathVariable String medataSetId) {
		metadataApiService.deleteMetadataSetByDataUri(dataUri, medataSetId);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * 유형 모델별 메타데이터 셋 상태 변경
	 * @Author      : heenim
	 * @Date        : 2023. 05. 16.
	 * @param dataUri
	 * @param medataSetId
	 * @param metadataSetVo
	 * @return
	 */
	@Operation(summary="유형 모델별 메타데이터 셋 상태 변경")
	@PatchMapping("/api/v1/resource/{dataUri}/{medataSetId}")	
	public ResponseEntity<Object> changeMetadataSetStatusByDataUri(@PathVariable String dataUri, @PathVariable String medataSetId, @RequestBody MetadataSetVo metadataSetVo) {
		metadataSetVo.setMedataSetId(medataSetId);
		metadataApiService.changeMetadataSetStatusByDataUri(dataUri, medataSetId, metadataSetVo);
		return makeResponseEntity(new ResultIdVo(medataSetId));
	}
	
	/**
	 * 유형 모델별 메타데이터 프라퍼티 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 01.
	 * @param dataUri
	 * @param medataSetId
	 * @param prptyNm
	 * @param pageVo
	 * @return
	 */
	@Operation(summary="유형 모델별 메타데이터 프라퍼티 조회")
	@GetMapping("/api/v1/resource/{dataUri}/{medataSetId}/properties/{prptyNm}")	
	public ResponseEntity<Object> getPropertyValueListByDataUri(@PathVariable String dataUri, @PathVariable String medataSetId, @PathVariable String prptyNm, PageVo pageVo) {
		SearchResultListVo listVo = metadataApiService.getPropertyValueListByDataUri(dataUri, medataSetId, prptyNm, pageVo);
		return makeResponseEntity(listVo);
	}
	
	/**
	 * 유형 모델별 메타데이터 프라퍼티 저장 (Multi) - upsert
	 * @Author      : heenim
	 * @Date        : 2023. 06. 02.
	 * @param dataUri
	 * @param medataSetId
	 * @param prptyNm
	 * @param dataValList
	 * @return
	 */
	@Operation(summary="유형 모델별 메타데이터 프라퍼티 저장 (Multi) - upsert")
	@PutMapping("/api/v1/resource/{dataUri}/{medataSetId}/properties/{prptyNm}")	
	public ResponseEntity<Object> savePropertyValueListByDataUri(@PathVariable String dataUri, @PathVariable String medataSetId, @PathVariable String prptyNm, @RequestBody List<Object> dataValList) {
		log.debug("dataUri : {}", dataUri);
		
		int c = 0;
		for (Object valObj : dataValList) {
			log.debug("valObj [{}] : {}", c++, valObj);
		}
		
		metadataApiService.savePropertyValueListByDataUri(dataUri, medataSetId, prptyNm, dataValList);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * 유형 모델별 메타데이터 프라퍼티 삭제 (Multi)
	 * @Author      : heenim
	 * @Date        : 2023. 06. 02.
	 * @param dataUri
	 * @param medataSetId
	 * @param prptyNm
	 * @param deleteValList
	 * @return
	 */
	@Operation(summary="유형 모델별 메타데이터 프라퍼티 삭제 (Multi)")
	@DeleteMapping("/api/v1/resource/{dataUri}/{medataSetId}/properties/{prptyNm}")	
	public ResponseEntity<Object> deletePropertyValueListByDataUri(@PathVariable String dataUri, @PathVariable String medataSetId, @PathVariable String prptyNm, @RequestBody(required=false) List<Object> deleteValList) {
		metadataApiService.deletePropertyValueListByDataUri(dataUri, medataSetId, prptyNm, deleteValList);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * 메타데이터 셋 조회 (유형 상관 없음)
	 * @Author      : heenim
	 * @Date        : 2023. 07. 11.
	 * @param medataSetId
	 * @return
	 */
	@Operation(summary="메타데이터 셋 조회 (유형 상관 없음)")
	@GetMapping("/api/v1/resource/data/{medataSetId}")	
	public ResponseEntity<Object> getDataMapFromMetadataSet(@PathVariable String medataSetId,
			@RequestParam(name="arrayDataLimitYn", required=false) @Parameter(name = "arrayDataLimitYn", description="배열 데이터 조회 제한 여부", example="Y", required=false) String arrayDataLimitYn,
			@RequestParam(name="arrayDataLimit", required=false) @Parameter(description="배열 데이터 조회 기본 건수", example="50", required=false) Integer arrayDataLimit) {
		ListOrderedMap<String, Object> dataMap = metadataApiService.getDataMapFromMetadataSet(medataSetId, null, false, arrayDataLimitYn, arrayDataLimit);
		if (dataMap == null) throw new ResNotFoundException();
		return makeResponseEntity(dataMap);
	}
	
}
