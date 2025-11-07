package kr.co.n2m.platform.meta.resource.metadata.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.map.ListOrderedMap;
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
import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataApiSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataPropertySearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataApiService;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.model.service.ModelService;

@Tag(name = "메타데이터 리소스 페이지 (공개 화면용)")
@RestController
public class ResourcePageController extends ResponseComponent {
	
	@Autowired
	private MetadataSetService metadataSetService;
	
	@Autowired
	private ModelService modelService;
	
	@Autowired
	private MetadataApiService metadataApiService;

	/**
	 * 메타데이터 리소스 페이지 관련 정보 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 01.
	 * @param medataSetId
	 * @return
	 */
	@SuppressWarnings("unchecked")
	@Operation(summary="TODO 메타데이터 리소스 페이지 관련 정보 조회 (우선 권한 체크안하고 공개)")
	@GetMapping("/api/v1/public/resource/data/{medataSetId}")
	public ResponseEntity<Object> getPageData(@PathVariable String medataSetId) {
		Map<String, Object> resMap = new HashMap<>();
		
		ModelInfoDto modelInfoDto = null;
		List<MetadataDto> dataList = null;
		List<CamelCaseMap> dtwList = null;
		
		MetadataSetDto setDto = metadataSetService.getMetadataSet(medataSetId);
		if (setDto != null) {
			modelInfoDto = modelService.getModelInfoByNameFromCache(setDto.getModelNm());
			dataList = metadataSetService.getMetadataListWithSetIdForSave(medataSetId, "");
			dtwList = (List<CamelCaseMap>) metadataSetService.getMetadataSetDtwListBySubSetId(medataSetId).getList();
		}
		
		resMap.put("medataSet", setDto);
		resMap.put("modelInfo", modelInfoDto);
		resMap.put("dataList", dataList);
		resMap.put("dtwList", dtwList);
		
		return makeResponseEntity(resMap);
	}
	
	/**
	 * 메타데이터 리소스 페이지 관련 프라퍼티 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 01.
	 * @param medataSetId
	 * @return
	 */	
	@Operation(summary="TODO 메타데이터 리소스 페이지 관련 프라퍼티 조회 (우선 권한 체크안하고 공개)")
	@GetMapping("/api/v1/public/resource/data/{medataSetId}/properties/{prptyNm}")
	public ResponseEntity<Object> getPagePropertyData(@PathVariable String medataSetId, @PathVariable String prptyNm, MetadataPropertySearchVo metadataPropertySearchVo) {
		metadataPropertySearchVo.setMedataSetId(medataSetId);
		metadataPropertySearchVo.setPrptyNm(prptyNm);
		return makeResponseEntity(metadataSetService.getMetadataListBySetPropertyNm(metadataPropertySearchVo));
	}
	
	
	
	
//	============================================================================
//	TODO: 하단 API 2개 일산 킨텍스 부스 전시 이후 삭제 필요
//	============================================================================
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
			  "<br />ex)/api/v1/public/resource//{dataUri}/{medataSetId}/properties/{prptyNm}")
	@GetMapping("/api/v1/public/resource/{dataUri}")	
	public ResponseEntity<Object> getDataMapListByDataUri(@PathVariable String dataUri, MetadataApiSearchVo metadataApiSearchVo) {
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
	@GetMapping("/api/v1/public/resource/{dataUri}/{medataSetId}")	
	public ResponseEntity<Object> getDataMapFromMetadataSet(@PathVariable String dataUri, @PathVariable String medataSetId,
			@RequestParam(name="arrayDataLimitYn", required=false) @Parameter(name = "arrayDataLimitYn", description="배열 데이터 조회 제한 여부", example="Y", required=false) String arrayDataLimitYn,
			@RequestParam(name="arrayDataLimit", required=false) @Parameter(description="배열 데이터 조회 기본 건수", example="50", required=false) Integer arrayDataLimit) {
		ListOrderedMap<String, Object> dataMap = metadataApiService.getDataMapByDataUri(dataUri, medataSetId, arrayDataLimitYn, arrayDataLimit);
		if (dataMap == null) throw new ResNotFoundException();
		return makeResponseEntity(dataMap);
	}	
}
