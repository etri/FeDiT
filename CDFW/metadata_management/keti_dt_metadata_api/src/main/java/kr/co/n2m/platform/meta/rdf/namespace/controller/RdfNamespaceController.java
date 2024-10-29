package kr.co.n2m.platform.meta.rdf.namespace.controller;

import java.util.Map;

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
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceSearchVo;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceVo;
import kr.co.n2m.platform.meta.rdf.namespace.service.RdfNamespaceService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "RDF 네임스페이스", description = "RDF 네임스페이스 API")
@Slf4j
@RestController
public class RdfNamespaceController extends ResponseComponent {

	@Autowired
	private RdfNamespaceService rdfNamespaceService;
	
	/** RDF 네임스페이스 관리 목록 조회 */
	@Operation(summary="RDF 네임스페이스 관리 목록 조회")
	@GetMapping("/api/v1/rdf/namespaces")
	public ResponseEntity<Object> getNamespaceList(RdfNamespaceSearchVo searchVo) {
		return makeResponseEntity(rdfNamespaceService.getNamespaceList(searchVo));
	}

	/** RDF 네임스페이스 상세 조회 */
	@Operation(summary="RDF 네임스페이스 관리 상세 조회")
	@GetMapping("/api/v1/rdf/namespaces/{rdfNmspId}")	
	public ResponseEntity<Object> getNamespace(
			@Parameter(name="rdfNmspId", description="RDF 네임스페이스 ID") @PathVariable String rdfNmspId, RdfNamespaceVo rdfNamespaceVo) {
		
		rdfNamespaceVo.setRdfNmspId(rdfNmspId);
		RdfNamespaceVo vo = rdfNamespaceService.getRdfNamespace(rdfNamespaceVo);
		if (vo == null) throw new ResNotFoundException("RDF 네임스페이스 데이터가 존재하지 않습니다.");

		return makeResponseEntity(vo);
	}
	
	/** RDF 네임스페이스 등록 */
	@Operation(summary="RDF 네임스페이스 등록")
	@PostMapping("/api/v1/rdf/namespaces")
	public ResponseEntity<Object> createNamespaces(@RequestBody RdfNamespaceVo rdfNamespaceVo) {
		
		log.debug(rdfNamespaceVo.toString());
		String result = rdfNamespaceService.createNamespace(rdfNamespaceVo);	
		return makeResponseEntity(new ResultIdVo(result), HttpStatus.CREATED, "/api/v1/rdf/namespaces/" + result);
	}
	
	/** RDF 네임스페이스 수정 */
	@Operation(summary="RDF 네임스페이스 수정")
	@PutMapping("/api/v1/rdf/namespaces/{rdfNmspId}")
	public ResponseEntity<Object> modifyNamespaces(
			@Parameter(name="rdfNmspId", description="RDF 네임스페이스 ID") @PathVariable String rdfNmspId, @RequestBody RdfNamespaceVo rdfNamespaceVo) {
		
		log.debug(rdfNamespaceVo.toString());
		compareUniqueId(rdfNmspId, rdfNamespaceVo.getRdfNmspId());
		rdfNamespaceService.modifyNamespace(rdfNamespaceVo);
		return makeResponseEntity(new ResultIdVo(rdfNamespaceVo.getRdfNmspId()));
	}
	
	/** RDF 네임스페이스 삭제 */
	@Operation(summary="RDF 네임스페이스 삭제")
	@DeleteMapping("/api/v1/rdf/namespaces/{rdfNmspId}")
	public ResponseEntity<Object> deleteNamespaces(@PathVariable String rdfNmspId) {
		
		rdfNamespaceService.deleteNamespace(rdfNmspId);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/** RDF 네임스페이스 URI 중복체크 */
	@Operation(summary="RDF 네임스페이스 URI 중복체크")
	@GetMapping("/api/v1/rdf/namespaces/checkUri")
	public ResponseEntity<Object> checkNamespaceUri(RdfNamespaceVo rdfNamespaceVo) {
		Map<String, Boolean> resMap = rdfNamespaceService.checkNamespaceUri(rdfNamespaceVo);
		return makeResponseEntity(resMap);
	}
	
	/** RDF 네임스페이스 Prefix 중복체크 */
	@Operation(summary="RDF 네임스페이스 Prefix 중복체크")
	@GetMapping("/api/v1/rdf/namespaces/checkPrefix")
	public ResponseEntity<Object> checkNamespacePfix(RdfNamespaceVo rdfNamespaceVo) {
		Map<String, Boolean> resMap = rdfNamespaceService.checkNamespacePrefix(rdfNamespaceVo);		
		return makeResponseEntity(resMap);
	}
}
