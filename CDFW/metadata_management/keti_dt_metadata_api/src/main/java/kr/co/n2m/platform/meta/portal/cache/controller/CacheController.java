package kr.co.n2m.platform.meta.portal.cache.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.portal.code.service.CodeCacheService;
import kr.co.n2m.platform.meta.portal.pat.domain.PatVo;
import kr.co.n2m.platform.meta.rdf.mapping.service.RdfMappingCacheService;
import kr.co.n2m.platform.meta.schema.model.service.ModelCacheService;
import kr.co.n2m.platform.meta.schema.property.service.PropertyService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "Cache 관리", description = "Cache 관리 API")
@Slf4j
@RestController
public class CacheController extends ResponseComponent {
	
	@Autowired
	ModelCacheService modelCacheService;
	
	@Autowired
	PropertyService propertyService;
	
	@Autowired
	RdfMappingCacheService rdfMappingCacheService;
	
	@Autowired
	CodeCacheService codeCacheService;
	
	
	/**
	 * 모델 목록 전체를 캐시에서 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 12. 09. 
	 * @return
	 */
	@Operation(summary="모델 목록 전체를 캐시에서 삭제")
	@DeleteMapping("/api/v1/portal/caches/modellist")
	public ResponseEntity<Object> removeModelListAll() {
		modelCacheService.removeModelListAll();
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * 유형 모델 정보 전체를 캐시에서 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 12. 09. 
	 * @return
	 */
	@Operation(summary="모델 목록 전체를 캐시에서 삭제")
	@DeleteMapping("/api/v1/portal/caches/typemodel")
	public ResponseEntity<Object> removeTypeModelAllByDataUri() {
		modelCacheService.removeTypeModelAllByDataUri();
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * 모델 정보 전체를 캐시에서 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 12. 09. 
	 * @return
	 */
	@Operation(summary="모델 정보 전체를 캐시에서 삭제")
	@DeleteMapping("/api/v1/portal/caches/model")
	public ResponseEntity<Object> removeModelInfoAll() {
		modelCacheService.removeModelInfoAll();
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	
	
	
	/**
	 * 프라퍼티 정보 전체를 캐시에서 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 12. 09. 
	 * @return
	 */
	@Operation(summary="프라퍼티 정보 전체를 캐시에서 삭제")
	@DeleteMapping("/api/v1/portal/caches/property")
	public ResponseEntity<Object> removePropertyInfoAll() {
		propertyService.clearAllPropertyCache();
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	
	
	
	/**
	 * RDF 매핑 정보 전체를 캐시에서 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 12. 09. 
	 * @return
	 */
	@Operation(summary="RDF 매핑 정보 전체를 캐시에서 삭제")
	@DeleteMapping("/api/v1/portal/caches/rdf")
	public ResponseEntity<Object> removeAllRdfMapping() {
		rdfMappingCacheService.removeAllRdfMapping();
		rdfMappingCacheService.removeAllRdfMappingBySearching();
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * RDF 매핑 모델 정보 전체를 캐시에서 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 12. 09. 
	 * @return
	 */
	@Operation(summary="RDF 매핑 모델 정보 전체를 캐시에서 삭제")
	@DeleteMapping("/api/v1/portal/caches/rdfmodel")
	public ResponseEntity<Object> removeAllRdfMappingModelList() {
		rdfMappingCacheService.removeAllRdfMappingModelList();
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * RDF 매핑 규칙 정보 전체를 캐시에서 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 12. 09. 
	 * @return
	 */
	@Operation(summary="RDF 매핑 규칙 정보 전체를 캐시에서 삭제")
	@DeleteMapping("/api/v1/portal/caches/rdfrule")
	public ResponseEntity<Object> removeAllRdfMappingRuleList() {
		rdfMappingCacheService.removeAllRdfMappingRuleList();
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * RDF 매핑 네임스페이스 정보 전체를 캐시에서 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 12. 09. 
	 * @return
	 */
	@Operation(summary="RDF 매핑 네임스페이스 정보 전체를 캐시에서 삭제")
	@DeleteMapping("/api/v1/portal/caches/rdfnamespace")
	public ResponseEntity<Object> removeAllRdfNamespaceList() {
		rdfMappingCacheService.removeAllRdfNamespaceList();
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	
	
	
	/**
	 * 코드 그룹 정보와 코드 정보 전체를 캐시에서 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 12. 09. 
	 * @return
	 */
	@Operation(summary="코드 그룹 정보와 코드 정보 전체를 캐시에서 삭제")
	@DeleteMapping("/api/v1/portal/caches/code")
	public ResponseEntity<Object> removeCodeGroupDtoAll() {
		codeCacheService.removeCodeGroupDtoAll();
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
}
