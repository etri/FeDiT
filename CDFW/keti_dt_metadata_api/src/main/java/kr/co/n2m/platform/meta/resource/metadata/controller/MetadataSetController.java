package kr.co.n2m.platform.meta.resource.metadata.controller;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
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
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataChgHstSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataConnectDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataPropertySearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSaveDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetSaveDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetVo;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataApiService;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;

@Tag(name = "메타데이터 (화면용)", description = "메타데이터 관리 API (화면용)")
@RestController
public class MetadataSetController extends ResponseComponent {
	
	@Autowired
	MetadataSetService metadataSetService;
	
	@Autowired
	MetadataApiService MetadataApiService;
	
	/**
	 * 메타데이터 셋 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 17.
	 * @param metadataSearchVo
	 * @return
	 */
	@Operation(summary="메타데이터 셋 목록 조회")
	@GetMapping("/api/v1/resource/metadatasets")
	public ResponseEntity<Object> getMetadataSetList(MetadataSearchVo metadataSearchVo) {
		return makeResponseEntity(metadataSetService.getMetadataSetList(metadataSearchVo));
	}
	
	/**
	 * 메타데이터 셋 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 17.
	 * @param medataSetId
	 * @return
	 */
	@Operation(summary="메타데이터 셋 조회")
	@GetMapping("/api/v1/resource/metadatasets/{medataSetId}")
	public ResponseEntity<Object> getMetadataSet(@PathVariable String medataSetId) {
		return makeResponseEntity(metadataSetService.getMetadataSet(medataSetId));
	}
	
	/**
	 * 메타데이터 셋의 모델 정보 조회
	 * @param medataSetId
	 * @return
	 */
	@Operation(summary="메타데이터 셋의 모델 정보 조회")
	@GetMapping("/api/v1/resource/metadatasets/{medataSetId}/modelinfo")
	public ResponseEntity<Object> getModelInfoBySetId(@PathVariable String medataSetId) {
		return makeResponseEntity(metadataSetService.getModelInfoBySetId(medataSetId));
	}
	
	/**
	 * 메타데이터 셋의 프라퍼티 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 17.
	 * @param medataSetId
	 * @param prptyNm
	 * @return
	 */
	@Operation(summary="메타데이터 셋의 프라퍼티 조회")
	@GetMapping("/api/v1/resource/metadatasets/{medataSetId}/properties/{prptyNm}")
	public ResponseEntity<Object> getMetadataSet(@PathVariable String medataSetId, @PathVariable String prptyNm, MetadataPropertySearchVo metadataPropertySearchVo) {
		metadataPropertySearchVo.setMedataSetId(medataSetId);
		metadataPropertySearchVo.setPrptyNm(prptyNm);
		return makeResponseEntity(metadataSetService.getMetadataListBySetPropertyNm(metadataPropertySearchVo));
	}
	
	/**
	 * 메타데이터 셋 생성
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param metadataSetSaveDto
	 * @return
	 */
	@Operation(summary="메타데이터 셋 생성")
	@PostMapping("/api/v1/resource/metadatasets")	
	public ResponseEntity<Object> createMetadataSetFromSetVo(@RequestBody MetadataSetSaveDto metadataSetSaveDto) {
		String newId = metadataSetService.createMetadataSetFromSetVo(metadataSetSaveDto);
		return makeResponseEntity(new ResultIdVo(newId), HttpStatus.CREATED, "/api/v1/resource/metadatasets/" + newId);
	}
	
	/**
	 * 메타데이터 셋 수정
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param medataSetId
	 * @param metadataSetSaveDto
	 * @return
	 */
	@Operation(summary="메타데이터 셋 수정")
	@PutMapping("/api/v1/resource/metadatasets/{medataSetId}")
	public ResponseEntity<Object> modifyMetadataSet(@PathVariable String medataSetId, @RequestBody MetadataSetSaveDto metadataSetSaveDto) {
		if (StringUtils.isNotBlank(metadataSetSaveDto.getMedataSetId())) {
			compareUniqueId(medataSetId, metadataSetSaveDto.getMedataSetId());
		}
		metadataSetSaveDto.setMedataSetId(medataSetId);
		metadataSetService.modifyMetadataSetFromSetVo(metadataSetSaveDto);
		return makeResponseEntity(new ResultIdVo(medataSetId));
	}
	
	/**
	 * 메타데이터 셋과 메타데이터 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param medataSetId
	 * @param metadataSetVo
	 * @return
	 */
	@Operation(summary="메타데이터 셋 과 메타데이터 삭제")
	@DeleteMapping("/api/v1/resource/metadatasets/{medataSetId}")
	public ResponseEntity<Object> deleteMetadataSetAndMetadataBySetId(@PathVariable String medataSetId) {
		metadataSetService.deleteMetadataSetAndMetadataBySetId(medataSetId, null, false);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * 메타데이터 셋 상태 변경
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param medataSetId
	 * @param metadataSetVo
	 * @return
	 */
	@Operation(summary="메타데이터 셋 상태 변경")
	@PatchMapping("/api/v1/resource/metadatasets/{medataSetId}")
	public ResponseEntity<Object> modifyMetadataSetStatus(@PathVariable String medataSetId, @RequestBody MetadataSetVo metadataSetVo) {
		metadataSetVo.setMedataSetId(medataSetId);
		metadataSetService.modifyMetadataSetStatusFromSetVo(metadataSetVo, null, false);
		return makeResponseEntity(new ResultIdVo(medataSetId));
	}
	
	/**
	 * 저장을 위한 메타데이터 목록 조회  (배열 프라퍼티, json, geoJson 아닌 것만 조회)
	 * @Author      : heenim
	 * @Date        : 2023. 05. 19.
	 * @param medataSetId
	 * @param cntPrptyYn
	 * @return
	 */
	@Operation(summary="저장을 위한 메타데이터 목록 조회")
	@GetMapping("/api/v1/resource/metadatasets/{medataSetId}/properties-for-save")
	public ResponseEntity<Object> getMetadataListWithSetIdForSave(@PathVariable String medataSetId, @RequestParam(name="cntPrptyYn", required=false) String cntPrptyYn) {
		return makeResponseEntity(metadataSetService.getMetadataListWithSetIdForSave(medataSetId, cntPrptyYn));
	}	
	
	/**
	 * 메타데이터 셋의 메타데이터 저장 (Multi) - upsert
	 * @Author      : heenim
	 * @Date        : 2023. 05. 19.
	 * @param medataSetId
	 * @param dataDtoList
	 * @return
	 */
	@Operation(summary="메타데이터 셋의 메타데이터 저장 (Multi)")
	@PutMapping("/api/v1/resource/metadatasets/{medataSetId}/properties")
	public ResponseEntity<Object> saveMetadataListBySetId(@PathVariable String medataSetId, @RequestBody List<MetadataSaveDto> valDtoList) {
		int cnt = metadataSetService.saveMetadataListBySetId(medataSetId, valDtoList);
		if (cnt == 0) throw new ResBizInfoException("저장된 데이터가 없습니다.");
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * 메타데이터 셋 과 셋의 연결(관계) 메타데이터 등록 - insert
	 * @Author      : heenim
	 * @Date        : 2023. 05. 26.
	 * @param medataSetId
	 * @param metadataConnectDto
	 * @return
	 */
	@Operation(summary="메타데이터 셋 과 셋의 연결(관계) 메타데이터 등록")
	@PutMapping("/api/v1/resource/metadatasets/{medataSetId}/relation")	
	public ResponseEntity<Object> saveCnctMetadataSetProperty(@PathVariable String medataSetId, @RequestBody MetadataConnectDto metadataConnectDto) {
		if (StringUtils.isNotBlank(metadataConnectDto.getMedataSetId())) {
			compareUniqueId(medataSetId, metadataConnectDto.getMedataSetId());
		}
		metadataConnectDto.setMedataSetId(medataSetId);
		metadataSetService.saveCnctMetadataSetProperty(metadataConnectDto);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * 메타데이터 셋 ID로 연결된 상위 디지털트윈 메타데이터 셋 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 30.
	 * @param medataSetId
	 * @return
	 */
	@Operation(summary="메타데이터 셋 ID로 연결된 상위 디지털트윈 메타데이터 셋 목록 조회")
	@GetMapping("/api/v1/resource/metadatasets/{medataSetId}/top-dts")	
	public ResponseEntity<Object> getMetadataSetDtwListBySubSetId(@PathVariable String medataSetId) {
		return makeResponseEntity(metadataSetService.getMetadataSetDtwListBySubSetId(medataSetId));
	}
		
	/**
	 * 메타데이터 셋의 변경이력 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 21.
	 * @param metadataSearchVo
	 * @return
	 */
	@Operation(summary="메타데이터 셋의 변경이력 목록 조회")
	@GetMapping("/api/v1/resource/metadatasets/{medataSetId}/histories")
	public ResponseEntity<Object> getMetadataChgHstListBySetId(@PathVariable String medataSetId, MetadataChgHstSearchVo MetadataChgHstSearchVo) {
		MetadataChgHstSearchVo.setMedataSetId(medataSetId);
		return makeResponseEntity(metadataSetService.getMetadataChgHstList(MetadataChgHstSearchVo));
	}	
	
	
	
	/**
	 * 메타데이터 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 17.
	 * @param metadataSearchVo
	 * @return
	 */
	@Operation(summary="메타데이터 목록 조회")
	@GetMapping("/api/v1/resource/metadata")
	public ResponseEntity<Object> getMetadataList(MetadataSearchVo metadataSearchVo) {
		return makeResponseEntity(metadataSetService.getMetadataList(metadataSearchVo));
	}
	
	/**
	 * 메타데이터 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 17.
	 * @param medataId
	 * @return
	 */
	@Operation(summary="메타데이터 조회")
	@GetMapping("/api/v1/resource/metadata/{medataId}")
	public ResponseEntity<Object> getMetadata(@PathVariable String medataId) {
		return makeResponseEntity(metadataSetService.getMetadata(medataId));
	}
	
	/**
	 * 메타데이터 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 05. 19.
	 * @param medataId
	 * @return
	 */
	@Operation(summary="메타데이터 삭제")
	@DeleteMapping("/api/v1/resource/metadata/{medataId}")
	public ResponseEntity<Object> deleteMetadata(@PathVariable String medataId) {
		metadataSetService.deleteMetadata(medataId);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}

}
