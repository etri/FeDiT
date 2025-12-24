package kr.co.n2m.platform.meta.rdf.mapping.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.exception.RdfCheckedException;
import kr.co.n2m.platform.meta.rdf.mapping.service.RdfMappingCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "RDF 매핑 Cache", description = "RDF 매핑 Cache 테스트 API")
@Slf4j
@RestController
@RequiredArgsConstructor
public class RdfMappingCacheController extends ResponseComponent {

    private final RdfMappingCacheService rdfMappingCacheService;

    /************************** RDF 매핑 (by rdfMappgId) **************************/

//    @Operation(summary = "RDF 매핑 Cache 조회")
//    @GetMapping("/api/v1/rdf/cache/mappings")
//    public ResponseEntity<Object> getMapping(String rdfMappgId) throws RdfCheckedException {
//        return makeResponseEntity(rdfMappingCacheService.getRdfMapping(rdfMappgId));
//    }
//
//    @Operation(summary = "RDF 매핑 Cache 삭제")
//    @DeleteMapping("/api/v1/rdf/cache/mappings")
//    public ResponseEntity<Object> deleteMapping(String rdfMappgId) throws RdfCheckedException {
//        rdfMappingCacheService.removeRdfMapping(rdfMappgId);
//        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
//    }
//
//    @Operation(summary = "RDF 매핑 Cache 전체 삭제")
//    @DeleteMapping("/api/v1/rdf/cache/all-mappings")
//    public ResponseEntity<Object> deleteAllMappings() {
//        rdfMappingCacheService.removeAllRdfMapping();
//        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
//    }
//
//     /************************** RDF 매핑 (by key) **************************/
//
//    @Operation(summary = "RDF 매핑 Cache 조회")
//    @GetMapping("/api/v1/rdf/cache/mappings-by-key")
//    public ResponseEntity<Object> getMappingBySearching(String rdfFormMtcd, String typeModelId) throws RdfCheckedException {
//        return makeResponseEntity(rdfMappingCacheService.getRdfMappingBySearching(rdfMappingCacheService.getRdfMappingKey(rdfFormMtcd, typeModelId)));
//    }
//
//    @Operation(summary = "RDF 매핑 Cache 삭제")
//    @DeleteMapping("/api/v1/rdf/cache/mappings-by-key")
//    public ResponseEntity<Object> deleteMappingBySearching(String rdfFormMtcd, String typeModelId) throws RdfCheckedException {
//        rdfMappingCacheService.removeRdfMappingBySearching(rdfMappingCacheService.getRdfMappingKey(rdfFormMtcd, typeModelId));
//        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
//    }
//
//    @Operation(summary = "RDF 매핑 Cache 전체 삭제")
//    @DeleteMapping("/api/v1/rdf/cache/all-mappings-by-key")
//    public ResponseEntity<Object> deleteAllMappingsBySearching() {
//        rdfMappingCacheService.removeAllRdfMappingBySearching();
//        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
//    }
//
//    /************************** RDF 매핑 모델 **************************/
//
//    @Operation(summary = "RDF 매핑 모델 Cache 조회")
//    @GetMapping("/api/v1/rdf/cache/mappingmodels")
//    public ResponseEntity<Object> getMappingModel(String rdfMappgId) {
//        return makeResponseEntity(rdfMappingCacheService.getRdfMappingModelList(rdfMappgId));
//    }
//
//    @Operation(summary = "RDF 매핑 모델 Cache 삭제")
//    @DeleteMapping("/api/v1/rdf/cache/mappingmodels")
//    public ResponseEntity<Object> deleteMappingModel(String rdfMappgId) {
//        rdfMappingCacheService.removeRdfMappingModelList(rdfMappgId);
//        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
//    }
//
//    @Operation(summary = "RDF 매핑 모델 Cache 전체 삭제")
//    @DeleteMapping("/api/v1/rdf/cache/all-mappingmodels")
//    public ResponseEntity<Object> deleteAllMappingModels() {
//        rdfMappingCacheService.removeAllRdfMappingModelList();
//        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
//    }
//
//    /************************** RDF 매핑 규칙 **************************/
//
//    @Operation(summary = "RDF 매핑 규칙 Cache 조회")
//    @GetMapping("/api/v1/rdf/cache/mappingrules")
//    public ResponseEntity<Object> getMappingRule(String rdfMappgModelId) {
//        return makeResponseEntity(rdfMappingCacheService.getRdfMappingRuleList(rdfMappgModelId));
//    }
//
//    @Operation(summary = "RDF 매핑 규칙 Cache 삭제")
//    @DeleteMapping("/api/v1/rdf/cache/mappingrules")
//    public ResponseEntity<Object> deleteMappingRule(String rdfMappgModelId) {
//        rdfMappingCacheService.removeRdfMappingRuleList(rdfMappgModelId);
//        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
//    }
//
//    @Operation(summary = "RDF 매핑 규칙 Cache 전체 삭제")
//    @DeleteMapping("/api/v1/rdf/cache/all-mappingrules")
//    public ResponseEntity<Object> deleteAllMappingRules() {
//        rdfMappingCacheService.removeAllRdfMappingRuleList();
//        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
//    }
//
//
//    /************************** RDF 네임스페이스 (by rdfMappgModelId) **************************/
//
//    @Operation(summary = "RDF 매핑모델을 이용한 RDF 네임스페이스 Cache 조회")
//    @GetMapping("/api/v1/rdf/cache/namespaces-by-mappingmodel")
//    public ResponseEntity<Object> getRdfNamespaceByMappingModel(String rdfMappgModelId) {
//        return makeResponseEntity(rdfMappingCacheService.getRdfNamespaceListByRdfModelId(rdfMappgModelId));
//    }
//
//    @Operation(summary = "RDF 매핑모델을 이용한 RDF 네임스페이스 Cache 삭제")
//    @DeleteMapping("/api/v1/rdf/cache/namespaces-by-mappingmodel")
//    public ResponseEntity<Object> deleteRdfNamespaceByMappingModel(String rdfMappgModelId) {
//        rdfMappingCacheService.removeRdfNamespaceList(rdfMappgModelId);
//        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
//    }
//
//    @Operation(summary = "RDF 매핑모델을 이용한 RDF 네임스페이스 Cache 전체 삭제")
//    @DeleteMapping("/api/v1/rdf/cache/all-namespaces-by-mappingmodel")
//    public ResponseEntity<Object> deleteAllRdfNamespacesByMappingModel() {
//        rdfMappingCacheService.removeAllRdfNamespaceList();
//        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
//    }
    
}