package kr.co.n2m.platform.meta.resource.metadata.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.rdf.rdfclass.service.RdfClassService;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataPropertySearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.model.service.ModelService;

@Tag(name = "메타데이터 리소스 페이지 (공개 화면용)")
@RestController
public class ResourcePageController extends ResponseComponent {
	
	@Autowired
	MetadataSetService metadataSetService;
	
	@Autowired
	private ModelService modelService;

	/**
	 * 메타데이터 리소스 페이지 관련 정보 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 01.
	 * @param medataSetId
	 * @return
	 */
	@Operation(summary="TODO 메타데이터 리소스 페이지 관련 정보 조회 (우선 권한 체크안하고 공개)")
	@GetMapping("/api/v1/public/resource/data/{medataSetId}")
	public ResponseEntity<Object> getPageData(@PathVariable String medataSetId) {
		Map<String, Object> resMap = new HashMap<>();
		
		ModelInfoDto modelInfoDto = null;
		List<MetadataDto> dataList = null;		
		MetadataSetDto setDto = metadataSetService.getMetadataSet(medataSetId);
		if (setDto != null) {
			modelInfoDto = modelService.getModelInfoByNameFromCache(setDto.getModelNm());
			dataList = metadataSetService.getMetadataListWithSetIdForSave(medataSetId, "");
		}
		
		resMap.put("medataSet", setDto);
		resMap.put("modelInfo", modelInfoDto);
		resMap.put("dataList", dataList);
		
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
	
}
