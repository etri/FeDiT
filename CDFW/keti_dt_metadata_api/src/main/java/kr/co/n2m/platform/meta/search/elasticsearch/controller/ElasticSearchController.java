package kr.co.n2m.platform.meta.search.elasticsearch.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.search.elasticsearch.domain.ElasticSearchVo;
import kr.co.n2m.platform.meta.search.elasticsearch.service.ElasticSearchService;

@Tag(name = "ElasticSearch", description = "ElasticSearch API")
@RestController
public class ElasticSearchController extends ResponseComponent {
	
	@Autowired
	ElasticSearchService elasticSearchService;
	
	@Operation(summary="셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 조회")
	@GetMapping("/api/v1/search/elastic/data/{medataSetId}")
	public ResponseEntity<Object> getElasticData(@PathVariable String medataSetId) {
		return makeResponseEntity(elasticSearchService.getElasticData(medataSetId));
	}
	
	@Operation(summary="셋 ID 로 ElasticSearch에 메타데이터 셋 정보 등록/수정")
    @PutMapping("/api/v1/search/elastic/data/{medataSetId}")
    public ResponseEntity<Object> saveElasticData(@PathVariable String medataSetId) {
		elasticSearchService.saveElasticData(medataSetId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
	
    @Operation(summary="셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 삭제")
    @DeleteMapping("/api/v1/search/elastic/data/{medataSetId}")
    public ResponseEntity<Object> deleteElasticData(@PathVariable String medataSetId) {
    	elasticSearchService.deleteElasticData(medataSetId);
        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary="ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (내용, 날짜만 검색)")
	@GetMapping("/api/v1/search/elastic/data")
	public ResponseEntity<Object> getElasticDataList(ElasticSearchVo searchVo) {
		return makeResponseEntity(elasticSearchService.getElasticDataList(searchVo));
	}
    
    @Operation(summary="ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)")
    @GetMapping("/api/v1/search/elastic/data/json")
    public ResponseEntity<Object> getElasticDataListWithJson(String query) {
    	return makeResponseEntity(elasticSearchService.getElasticDataListWithJson(query));
    }
	
}
