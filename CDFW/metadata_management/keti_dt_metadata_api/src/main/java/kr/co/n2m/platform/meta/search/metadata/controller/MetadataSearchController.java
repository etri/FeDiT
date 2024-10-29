package kr.co.n2m.platform.meta.search.metadata.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.search.metadata.domain.DataSearchVo;
import kr.co.n2m.platform.meta.search.metadata.service.MetadataSearchService;

@Tag(name = "메타데이터 검색", description = "메타데이터 검색 API")
@RestController
public class MetadataSearchController extends ResponseComponent {
	
	@Autowired
	MetadataSearchService metadataSearchService;
	
	
	/**
	 * 메타데이터 검색 목록
	 * @Author      : tklee
	 * @Date        : 2024. 08. 06.
	 * @param metadataSearchVo
	 * @return
	 */
	@Operation(summary="메타데이터 검색 목록")
	@GetMapping("/api/v1/public/search/metadata")
	public ResponseEntity<Object> getMetadataList(DataSearchVo metadataSearchVo) {
		return makeResponseEntity(metadataSearchService.getMetadataList(metadataSearchVo));
	}
	
	
	/**
	 * geometry 유효성 검사 
	 * @Author      : tklee
	 * @Date        : 2024. 08. 13.
	 * @param metadataSearchVo
	 * @return
	 */
	@Operation(summary="geometry 유효성 검사")
	@GetMapping("/api/v1/public/search/metadata/geometry/validate")
	public ResponseEntity<Object> geometryValidate(DataSearchVo metadataSearchVo) {
		return makeResponseEntity(metadataSearchService.geometryValidate(metadataSearchVo));
	}
	
}
