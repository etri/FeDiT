package kr.co.n2m.platform.meta.rdf.neo4j.controller;

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
import kr.co.n2m.platform.meta.rdf.neo4j.domain.Neo4jSearchVo;
import kr.co.n2m.platform.meta.rdf.neo4j.service.Neo4jService;

@Tag(name = "그래프DB (NEO4J)", description = "그래프DB (NEO4J) API")
@RestController
public class Neo4jController extends ResponseComponent {
	
	@Autowired
	Neo4jService neo4jService;
	
	@Operation(summary = "NEO4J Browser URL")
    @GetMapping("/api/v1/rdf/graph/neo4j/browser-url")
    public ResponseEntity<Object> getNeo4jBrowserUrl() {
    	Map<String, String> resMap = new HashMap<>();
    	resMap.put("url", StringUtils.defaultString(neo4jService.getNeo4jBrowserUrl()));
        return makeResponseEntity(resMap);
    }
	
	@Operation(summary="NEO4J 조회 (RDF)")
	@GetMapping("/api/v1/rdf/graph/neo4j/data")
	public ResponseEntity<Object> getNeo4jData(Neo4jSearchVo searchVo) {
		return makeResponseEntity(neo4jService.getNeo4jData(searchVo));
	}	
	
    @Operation(summary="NEO4J 그래프 초기화 후 재등록 (설정 초기화 + 내용 전체 삭제 후 재등록) (RDF)")
    @PutMapping("/api/v1/rdf/graph/neo4j/data/init")
    public ResponseEntity<Object> initNeo4jGraphAndAddDataAll() {
    	neo4jService.initNeo4jGraphAndAddDataAll();
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
	
    @Operation(summary="셋 ID 로 NEO4J 그래프에 메타데이터 저장 - upsert (RDF)")
    @PutMapping("/api/v1/rdf/graph/neo4j/data/{medataSetId}")
    public ResponseEntity<Object> saveNeo4jMetadataSet(@PathVariable String medataSetId) {
    	neo4jService.saveNeo4jMetadataSet(medataSetId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }

    @Operation(summary="셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDF)")
    @DeleteMapping("/api/v1/rdf/graph/neo4j/data/{medataSetId}")
    public ResponseEntity<Object> deleteNeo4jMetadataSet(@PathVariable String medataSetId) {
    	neo4jService.deleteNeo4jMetadataSet(medataSetId);
        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    
    
	@Operation(summary="NEO4J 조회 (RDB)")
	@GetMapping("/api/v1/rdf/graph/neo4j/origindata")
	public ResponseEntity<Object> getNeo4jRdbMedata(Neo4jSearchVo searchVo) {
		return makeResponseEntity(neo4jService.getNeo4jRdbMedata(searchVo));
	}	
	
    @Operation(summary="셋 ID 로 NEO4J 그래프에 메타데이터 저장 - upsert (RDB)")
    @PutMapping("/api/v1/rdf/graph/neo4j/origindata/{medataSetId}")
    public ResponseEntity<Object> saveNeo4jRdbMetadataSet(@PathVariable String medataSetId) {
    	neo4jService.saveNeo4jRdbMetadataSet(medataSetId);
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
	
    @Operation(summary="NEO4J 그래프 초기화 후 재등록 (설정 초기화 + 내용 전체 삭제 후 재등록) (RDB)")
    @PutMapping("/api/v1/rdf/graph/neo4j/origindata/init")
    public ResponseEntity<Object> initNeo4jRdbGraphAndAddDataAll() {
    	neo4jService.initNeo4jRdbGraphAndAddDataAll();
    	return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
    
    @Operation(summary="셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDB)")
    @DeleteMapping("/api/v1/rdf/graph/neo4j/origindata/{medataSetId}")
    public ResponseEntity<Object> deleteNeo4jRdbMetadataSet(@PathVariable String medataSetId) {
    	neo4jService.deleteNeo4jRdbMetadataSet(medataSetId);
        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }

}
