package kr.co.n2m.platform.meta.datastore.influxdb.controller;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
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
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.InfluxDbKeywordDto;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.InfluxDbKeywordVo;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.InfluxDbSearchVo;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.JsonRecord;
import kr.co.n2m.platform.meta.datastore.influxdb.service.InfluxDbService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "influxDB", description = "influxDB 관련 API")
@Slf4j
@RestController
public class InfluxDbController extends ResponseComponent {
	
	@Autowired
	private InfluxDbService influxDbService;
	
	@Operation(summary = "InfluxDB URL")
    @GetMapping("/api/v1/datastore/influxdb/url")
    public ResponseEntity<Object> getUrl() {
    	Map<String, String> resMap = new HashMap<>();
    	resMap.put("url", StringUtils.defaultString(influxDbService.getInfluxDbBrowserUrl()));
        return makeResponseEntity(resMap);
    }
	
	@Operation(summary="최근 1년 동안의 키워드별 건수 현황 조회")
	@GetMapping("/api/v1/datastore/influxdb/count-by-keyword")
	public ResponseEntity<Object> getKeywordCountData(InfluxDbSearchVo searchVo) {
		return makeResponseEntity(influxDbService.getKeywordCountData(searchVo));
	}
	
    @Operation(summary = "키워드 측정 데이터 초기화 후 재등록 (내용 전체 삭제 후 재등록)")
    @PutMapping("/api/v1/datastore/influxdb/keywords/init")
    public ResponseEntity<Object> initKeywordMeasurement() {
    	String logRegrId = AuthUtil.getLoginUserId();
    	influxDbService.initKeywordMeasurement(logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "셋 ID 로 InfluxDB에 키워드 측정 데이터 저장 (삭제 후 재등록)")
    @PutMapping("/api/v1/datastore/influxdb/keywords/{medataSetId}")
    public ResponseEntity<Object> saveKeywordDataBySetId(@PathVariable String medataSetId) {
    	String logRegrId = AuthUtil.getLoginUserId();
    	influxDbService.saveKeywordDataBySetId(medataSetId, logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "셋 ID 로 InfluxDB에서 키워드 측정 데이터 삭제")
    @DeleteMapping("/api/v1/datastore/influxdb/keywords/{medataSetId}")
    public ResponseEntity<Object> deleteKeywordDataBySetId(@PathVariable String medataSetId) {
    	String logRegrId = AuthUtil.getLoginUserId();
    	influxDbService.deleteKeywordDataBySetId(medataSetId, logRegrId, InfluxDbService.THE_FIRST_ISO_TIME, null);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "json measurement 목록 조회. (기간 검색조건 필수)")
    @GetMapping("/api/v1/database/influxdb/data")
    public ResponseEntity<Object> getJsonMeasurementData(InfluxDbSearchVo influxDbSearchVo){
    	SearchResultListVo resultListVo = influxDbService.getJsonMeasurementData(influxDbSearchVo);
    	return makeResponseEntity(resultListVo, HttpStatus.OK);
    }
    
    @Operation(summary = "json measurement 지정 id 의 가장 최근 데이터 단건 조회")
    @GetMapping("/api/v1/database/influxdb/data/{medataSetId}/latest")
    public ResponseEntity<Object> getLatestJsonMeasurementByMedataSetId(
    		@Parameter(name="medataSetId", description="메타데이터셋ID") @PathVariable String medataSetId) {
    	JsonRecord jsonRecord = influxDbService.getLatestJsonMeasurementByMedataSetId(medataSetId);
    	return makeResponseEntity(jsonRecord, HttpStatus.OK);
    }
    
    @Operation(summary = "json measurement 지정 id의 목록 조회")
    @GetMapping("/api/v1/database/influxdb/data/{medataSetId}")
    public ResponseEntity<Object> getJsonMeasurementBySetId(
    		@Parameter(name="medataSetId", description="메타데이터셋ID") @PathVariable String medataSetId,
    		InfluxDbSearchVo influxDbSearchVo) {
    	SearchResultListVo resultListVo = 
    	influxDbService.getJsonMeasurementByMetadataSetId(medataSetId, influxDbSearchVo);
    	return makeResponseEntity(resultListVo, HttpStatus.OK);
    }
    
    @Operation(summary = "json measurement 지정 id 의 지정 시각의 데이터 단건 조회")
    @GetMapping("/api/v1/database/influxdb/data/{medataSetId}/{time}")
    public ResponseEntity<Object> getJsonMeasurementBySetIdAndTimestamp(
    		@Parameter(name="medataSetId", description="메타데이터셋ID") @PathVariable String medataSetId,
    		@Parameter(name="time", description="타임스탬프") @PathVariable String time) {
    	JsonRecord jsonRecord = influxDbService.getJsonMeasurementBySetIdAndTimestamp(medataSetId, time);
    	return makeResponseEntity(jsonRecord, HttpStatus.OK);
    }
    
	
	// TODO --- 아래 정리..
	
	@Operation(summary="테스트 조회")
	@GetMapping("/api/v1/datastore/influxdb/data")
	public ResponseEntity<Object> getJsonData(InfluxDbSearchVo searchVo) {
		return makeResponseEntity(influxDbService.getJsonData(searchVo));
	}
	

	
	@Operation(summary="테스트 키워드 등록(추가)")
	@PostMapping("/api/v1/datastore/influxdb/keywords")
	public ResponseEntity<Object> addKeywordData(@RequestBody InfluxDbKeywordDto dto) {
		log.debug("{}", dto);
		InfluxDbKeywordVo keywordVo = new InfluxDbKeywordVo(dto);
		influxDbService.addKeywordData(keywordVo);
		return makeResponseEntity(keywordVo);
	}	
	
}
