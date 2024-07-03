package kr.co.n2m.platform.meta.resource.metadata.controller;


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
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataApiSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataApiService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "디지털트윈 (외부 API용)", description = "디지털트윈 API (외부 API용)")
@Slf4j
@RestController
public class DigitalTwinApiController extends ResponseComponent {
	
	@Autowired
	MetadataApiService metadataApiService;
	
	/**
	 * 디지털트윈 목록 조회
	 * @Author      : tklee
	 * @Date        : 2024. 03. 18.
	 * @return
	 */
	@Operation(summary="디지털트윈 목록 조회."
			, description="배열로 정의된 프라퍼티인 경우 값이 10건 이하로만 조회됨. " +
			  "<br />해당 프라퍼티를 10건 이상 조회하고 싶은 경우. 다른 API 를 사용하여 조회해야 함. " +
			  "<br />ex)/api/v1/resource/dts/{digitalTwinId}/properties/{prptyNm}")
	@GetMapping("/api/v1/resource/dts")	
	public ResponseEntity<Object> getDigitalTwinDataMapList(MetadataApiSearchVo metadataApiSearchVo) {
		log.debug("{}", metadataApiSearchVo);
		SearchResultListVo listVo = metadataApiService.getDataMapListByDataUri("dts", metadataApiSearchVo);
		return makeResponseEntity(listVo);
	}

	/**
	 * 디지털트윈 상세 조회
	 * @Author      : tklee
	 * @Date        : 2024. 03. 18.
	 * @param digitalTwinId
	 * @return
	 */
	@Operation(summary="디지털트윈 상세 조회")
	@GetMapping("/api/v1/resource/dts/{digitalTwinId}")	
	public ResponseEntity<Object> getDigitalTwinDataMap(@PathVariable String digitalTwinId,
			@RequestParam(name="arrayDataLimitYn", required=false) @Parameter(name = "arrayDataLimitYn", description="배열 데이터 조회 제한 여부", example="Y", required=false) String arrayDataLimitYn,
			@RequestParam(name="arrayDataLimit", required=false) @Parameter(description="배열 데이터 조회 기본 건수", example="50", required=false) Integer arrayDataLimit) {
		ListOrderedMap<String, Object> dataMap = metadataApiService.getDataMapByDataUri("dts", digitalTwinId, arrayDataLimitYn, arrayDataLimit);
		if (dataMap == null) throw new ResNotFoundException();
		return makeResponseEntity(dataMap);
	}
	
	/**
	 * 디지털객체 목록 조회
	 * @Author      : tklee
	 * @Date        : 2024. 03. 19.
	 * @return
	 */
	@Operation(summary="디지털객체 목록 조회"
			, description="배열로 정의된 프라퍼티인 경우 값이 10건 이하로만 조회됨. " +
			  "<br />해당 프라퍼티를 10건 이상 조회하고 싶은 경우. 다른 API 를 사용하여 조회해야 함. " +
			  "<br />ex)/api/v1/resource/objects/{digitalObjectId}/properties/{prptyNm}")
	@GetMapping("/api/v1/resource/objects")
	public ResponseEntity<Object> getDigitalObjectDataMapList(MetadataApiSearchVo metadataApiSearchVo) {
		log.debug("{}", metadataApiSearchVo);
		SearchResultListVo listVo = metadataApiService.getDataMapListByDataUri("objects", metadataApiSearchVo);
		return makeResponseEntity(listVo);
	}

	/**
	 * 디지털객체 상세 조회
	 * @Author      : tklee
	 * @Date        : 2024. 03. 19.
	 * @param digitalObjectId
	 * @return
	 */
	@Operation(summary="디지털객체 상세 조회")
	@GetMapping("/api/v1/resource/objects/{digitalObjectId}")	
	public ResponseEntity<Object> getDigitalObjectDataMap(@PathVariable String digitalObjectId,
			@RequestParam(name="arrayDataLimitYn", required=false) @Parameter(name = "arrayDataLimitYn", description="배열 데이터 조회 제한 여부", example="Y", required=false) String arrayDataLimitYn,
			@RequestParam(name="arrayDataLimit", required=false) @Parameter(description="배열 데이터 조회 기본 건수", example="50", required=false) Integer arrayDataLimit) {
		ListOrderedMap<String, Object> dataMap = metadataApiService.getDataMapByDataUri("objects", digitalObjectId, arrayDataLimitYn, arrayDataLimit);
		if (dataMap == null) throw new ResNotFoundException();
		return makeResponseEntity(dataMap);
	}
	
	/**
	 * 디지털객체 상세 조회 (full objects data)
	 * @Author      : tklee
	 * @Date        : 2024. 04. 26.
	 * @param digitalObjectId
	 * @return
	 */
	@Operation(summary="디지털객체 상세 조회 (full objects data)")
	@GetMapping("/api/v1/resource/full-objects/{digitalObjectId}")	
	public ResponseEntity<Object> getDigitalFullObjectDataMap(@PathVariable String digitalObjectId,
			@RequestParam(name="arrayDataLimitYn", required=false) @Parameter(name = "arrayDataLimitYn", description="배열 데이터 조회 제한 여부", example="Y", required=false) String arrayDataLimitYn,
			@RequestParam(name="arrayDataLimit", required=false) @Parameter(description="배열 데이터 조회 기본 건수", example="50", required=false) Integer arrayDataLimit) {
		ListOrderedMap<String, Object> dataMap = metadataApiService.getFullDataMapByDataUri("objects", digitalObjectId, arrayDataLimitYn, arrayDataLimit);
		if (dataMap == null) throw new ResNotFoundException();
		return makeResponseEntity(dataMap);
	}
	
}
