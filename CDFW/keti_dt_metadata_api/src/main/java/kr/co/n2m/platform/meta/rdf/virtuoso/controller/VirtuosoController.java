package kr.co.n2m.platform.meta.rdf.virtuoso.controller;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.SparqlReqVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.service.VirtuosoService;

@Tag(name = "그래프DB (버투소)", description = "그래프DB (버투소) API")
@RestController
public class VirtuosoController extends ResponseComponent {
	
	@Autowired
	VirtuosoService virtuosoService;
	
	@Operation(summary = "버투소 Conductor URL")
    @GetMapping("/api/v1/rdf/graph/virtuoso/conductor-url")
    public ResponseEntity<Object> getGraphConductorUrl() {
    	Map<String, String> resMap = new HashMap<>();
    	resMap.put("url", StringUtils.defaultString(virtuosoService.getGraphConductorUrl()));
        return makeResponseEntity(resMap);
    }
	
    @Operation(summary = "버투소 연결 테스트 (true / false)")
    @GetMapping("/api/v1/rdf/graph/virtuoso/conn")
    public ResponseEntity<Object> testConnectVirtuoso() {
        return makeResponseEntity(virtuosoService.testConnectVirtuoso());
    }
    
    @Operation(summary = "그래프 초기화 후 재등록 (내용 전체 삭제 후 재등록)")
    @PutMapping("/api/v1/rdf/graph/virtuoso/data/init")
    public ResponseEntity<Object> initGraphForUse() {
    	String logRegrId = AuthUtil.getLoginUserId();
    	virtuosoService.initGraph("use", logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "셋 ID 로 그래프에 메터데이터 저장 - upsert")
    @PutMapping("/api/v1/rdf/graph/virtuoso/data/{medataSetId}")
    public ResponseEntity<Object> saveToGraphForUse(@PathVariable String medataSetId) {
    	String logRegrId = AuthUtil.getLoginUserId();
    	virtuosoService.saveRdfStatementsToGraphForUse(medataSetId, logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "셋 ID 로 그래프에서 메타데이터 삭제")
    @DeleteMapping("/api/v1/rdf/graph/virtuoso/data/{medataSetId}")
    public ResponseEntity<Object> deleteFromGraphForUse(@PathVariable String medataSetId) {
    	String logRegrId = AuthUtil.getLoginUserId();
    	virtuosoService.deleteRdfStatementsFromGraphForUse(medataSetId, logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "그래프에 시스템에서 정의한 RDF 네임스페이스 정보 저장 - upsert")
    @PutMapping("/api/v1/rdf/graph/virtuoso/data/namespace")
    public ResponseEntity<Object> saveRdfNsToGraphForUse() {
    	String logRegrId = AuthUtil.getLoginUserId();
    	virtuosoService.saveRdfNsToGraph("use", logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "그래프에 시스템에서 정의한 카테고리 정보 저장 - upsert")
    @PutMapping("/api/v1/rdf/graph/virtuoso/data/category")
    public ResponseEntity<Object> saveRdfSkosToGraphForUse() {
    	String logRegrId = AuthUtil.getLoginUserId();
    	virtuosoService.saveRdfSkosToGraph("use", logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "그래프 초기화 후 재등록 (내용 전체 삭제 후 재등록) (dev)")
    @PutMapping("/api/v1/rdf/graph/virtuoso/data/init-dev")
    public ResponseEntity<Object> initGraphForDev() {
    	String logRegrId = AuthUtil.getLoginUserId();
    	virtuosoService.initGraph("dev", logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "셋 ID 로 그래프에 메터데이터 저장 (dev)")
    @PutMapping("/api/v1/rdf/graph/virtuoso/data/{medataSetId}/dev")
    public ResponseEntity<Object> saveToGraphForDev(@PathVariable String medataSetId) {
    	String logRegrId = AuthUtil.getLoginUserId();
    	virtuosoService.saveRdfStatementsToGraphForDev(medataSetId, logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "셋 ID 로 그래프에서 메타데이터 삭제 (dev)")
    @DeleteMapping("/api/v1/rdf/graph/virtuoso/data/{medataSetId}/dev")
    public ResponseEntity<Object> deleteFromGraphForDev(@PathVariable String medataSetId) {
    	String logRegrId = AuthUtil.getLoginUserId();
    	virtuosoService.deleteRdfStatementsFromGraphForDev(medataSetId, logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "그래프에 시스템에서 정의한 RDF 네임스페이스 정보 저장 - upsert (dev)")
    @PutMapping("/api/v1/rdf/graph/virtuoso/data/namespace/dev")
    public ResponseEntity<Object> saveRdfNsToGraphForDev() {
    	String logRegrId = AuthUtil.getLoginUserId();
    	virtuosoService.saveRdfNsToGraph("dev", logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "그래프에 시스템에서 정의한 카테고리 정보 저장 - upsert (dev)")
    @PutMapping("/api/v1/rdf/graph/virtuoso/data/category/dev")
    public ResponseEntity<Object> saveRdfSkosToGraphForDev() {
    	String logRegrId = AuthUtil.getLoginUserId();
    	virtuosoService.saveRdfSkosToGraph("dev", logRegrId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary = "SPARQL 쿼리 실행")
    @GetMapping("/api/v1/rdf/graph/virtuoso/sparql")
    public ResponseEntity<Object> executeSparqlQuery(SparqlReqVo sparqlReqVo) {
        return makeResponseEntity(virtuosoService.executeSparqlQuery(sparqlReqVo));
    }

}
