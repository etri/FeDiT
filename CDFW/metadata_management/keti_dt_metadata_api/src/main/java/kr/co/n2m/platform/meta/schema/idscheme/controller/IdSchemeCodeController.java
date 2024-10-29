package kr.co.n2m.platform.meta.schema.idscheme.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import kr.co.n2m.platform.meta.schema.idscheme.domain.IdSchemeCodeDto;
import kr.co.n2m.platform.meta.schema.idscheme.domain.IdSchemeCodeVo;
import kr.co.n2m.platform.meta.schema.idscheme.domain.IdSchemeSearchVo;
import kr.co.n2m.platform.meta.schema.idscheme.service.IdSchemeCodeService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "식별체계 코드", description = "식별체계 코드 API")
@Slf4j
@RestController
public class IdSchemeCodeController extends ResponseComponent {
	
	@Autowired
	private IdSchemeCodeService idSchemeCodeService;
	
	
	// ksic : korean standard industrial classification
	@Operation(summary="식별체계 - 표준산업분류체계 코드 목록 조회")
	@GetMapping("/api/v1/schema/ksiccodes")
	public ResponseEntity<Object> getIdSchemeStdIndCodeList(IdSchemeSearchVo searchVo) {
		return makeResponseEntity(idSchemeCodeService.getIdSchemeStdIndCodeList(searchVo));
	}
	
	@Operation(summary="식별체계 - 표준산업분류체계 코드 대분류 외부 코드 목록 조회")
	@GetMapping("/api/v1/schema/ksiccodes/lctgcodes")
	public ResponseEntity<Object> getIdSchemeStdIndLctgCodeList() {
		return makeResponseEntity(idSchemeCodeService.getIdSchemeStdIndLctgCodeList());
	}
	
	@Operation(summary="식별체계 - 표준산업분류체계 코드 상세 조회")
	@GetMapping("/api/v1/schema/ksiccodes/{idSchmCd}")
	public ResponseEntity<Object> getIdSchemeStdIndCode(
			@Parameter(name="idSchmCd", description="식별체계 코드") @PathVariable String idSchmCd) {
		
		IdSchemeCodeDto dto = idSchemeCodeService.getIdSchemeStdIndCode(idSchmCd);
		if (dto == null) throw new ResNotFoundException("표준산업분류체계 코드 데이터가 존재하지 않습니다.");

		return makeResponseEntity(dto);
	}
	
	@Operation(summary="식별체계 - 표준산업분류체계 코드 등록")
	@PostMapping("/api/v1/schema/ksiccodes")
	public ResponseEntity<Object> createIdSchemeStdIndCode(@RequestBody IdSchemeCodeVo idSchemeCodeVo) {
		log.debug(idSchemeCodeVo.toString());
		String result = idSchemeCodeService.createIdSchemeStdIndCode(idSchemeCodeVo);	
		return makeResponseEntity(new ResultIdVo(result), HttpStatus.CREATED, "/api/v1/schema/ksiccodes/" + result);
	}
	
	@Operation(summary="식별체계 - 표준산업분류체계 코드 수정")
	@PutMapping("/api/v1/schema/ksiccodes/{idSchmCd}")
	public ResponseEntity<Object> modifyIdSchemeStdIndCode(
			@Parameter(name="idSchmCd", description="식별체계 코드") @PathVariable String idSchmCd, @RequestBody IdSchemeCodeVo idSchemeCodeVo) {
		
		log.debug(idSchemeCodeVo.toString());
		compareUniqueId(idSchmCd, idSchemeCodeVo.getIdSchmCd());
		idSchemeCodeService.modifyIdSchemeStdIndCode(idSchemeCodeVo);
		return makeResponseEntity(new ResultIdVo(idSchemeCodeVo.getIdSchmCd()));
	}
	// ksic : korean standard industrial classification
	

	
	// pbrc : public resource classification
	@Operation(summary="식별체계 - 공공자원분류체계 코드 목록 조회")
	@GetMapping("/api/v1/schema/pbrccodes")
	public ResponseEntity<Object> getIdSchemePubRiCodeList(IdSchemeSearchVo searchVo) {
		return makeResponseEntity(idSchemeCodeService.getIdSchemePubRiCodeList(searchVo));
	}
	
	@Operation(summary="식별체계 - 공공자원분류체계 코드 대분류 외부 코드 목록 조회")
	@GetMapping("/api/v1/schema/pbrccodes/lctgcodes")
	public ResponseEntity<Object> getIdSchemePubRiLctgCodeList() {
		return makeResponseEntity(idSchemeCodeService.getIdSchemePubRiLctgCodeList());
	}
	
	@Operation(summary="식별체계 - 공공자원분류체계 코드 상세 조회")
	@GetMapping("/api/v1/schema/pbrccodes/{idSchmCd}")	
	public ResponseEntity<Object> getIdSchemePubRiCode(
			@Parameter(name="idSchmCd", description="식별체계 코드") @PathVariable String idSchmCd) {
		
		IdSchemeCodeDto dto = idSchemeCodeService.getIdSchemePubRiCode(idSchmCd);
		if (dto == null) throw new ResNotFoundException("공공자원분류체계 코드 데이터가 존재하지 않습니다.");

		return makeResponseEntity(dto);
	}
	
	@Operation(summary="식별체계 - 공공자원분류체계 코드 등록")
	@PostMapping("/api/v1/schema/pbrccodes")
	public ResponseEntity<Object> createIdSchemePubRiCode(@RequestBody IdSchemeCodeVo idSchemeCodeVo) {
		log.debug(idSchemeCodeVo.toString());
		String result = idSchemeCodeService.createIdSchemePubRiCode(idSchemeCodeVo);	
		return makeResponseEntity(new ResultIdVo(result), HttpStatus.CREATED, "/api/v1/schema/pbrccodes/" + result);
	}
	
	@Operation(summary="식별체계 - 공공자원분류체계 코드 수정")
	@PutMapping("/api/v1/schema/pbrccodes/{idSchmCd}")
	public ResponseEntity<Object> modifyIdSchemePubRiCode(
			@Parameter(name="idSchmCd", description="식별체계 코드") @PathVariable String idSchmCd, @RequestBody IdSchemeCodeVo idSchemeCodeVo) {
		
		log.debug(idSchemeCodeVo.toString());
		compareUniqueId(idSchmCd, idSchemeCodeVo.getIdSchmCd());
		idSchemeCodeService.modifyIdSchemePubRiCode(idSchemeCodeVo);
		return makeResponseEntity(new ResultIdVo(idSchemeCodeVo.getIdSchmCd()));
	}
	
	
	
	// dtoc : digital twin object classification
	@Operation(summary="식별체계 - 객체 - 물품 코드 목록 조회")
	@GetMapping("/api/v1/schema/productcodes")
	public ResponseEntity<Object> getIdSchemeProductCodeList(IdSchemeSearchVo searchVo) {
		return makeResponseEntity(idSchemeCodeService.getIdSchemeProductCodeList(searchVo));
	}
	
	@Operation(summary="식별체계 - 객체 - 물품 코드 상세 조회")
	@GetMapping("/api/v1/schema/productcodes/{idSchmCd}")	
	public ResponseEntity<Object> getIdSchemeProductCode(
			@Parameter(name="idSchmCd", description="식별체계 코드") @PathVariable String idSchmCd) {
		
		IdSchemeCodeDto dto = idSchemeCodeService.getIdSchemeProductCode(idSchmCd);
		if (dto == null) throw new ResNotFoundException("객체 - 물품 코드 데이터가 존재하지 않습니다.");

		return makeResponseEntity(dto);
	}
	
	@Operation(summary="식별체계 - 객체 - 물품 코드 등록")
	@PostMapping("/api/v1/schema/productcodes")
	public ResponseEntity<Object> createIdSchemeProductCode(@RequestBody IdSchemeCodeVo idSchemeCodeVo) {
		log.debug(idSchemeCodeVo.toString());
		String result = idSchemeCodeService.createIdSchemeProductCode(idSchemeCodeVo);	
		return makeResponseEntity(new ResultIdVo(result), HttpStatus.CREATED, "/api/v1/schema/productcodes/" + result);
	}
	
	@Operation(summary="식별체계 - 객체 - 물품 코드 수정")
	@PutMapping("/api/v1/schema/productcodes/{idSchmCd}")	
	public ResponseEntity<Object> modifyIdSchemeProductCode(
			@Parameter(name="idSchmCd", description="식별체계 코드") @PathVariable String idSchmCd, @RequestBody IdSchemeCodeVo idSchemeCodeVo) {
		
		log.debug(idSchemeCodeVo.toString());
		compareUniqueId(idSchmCd, idSchemeCodeVo.getIdSchmCd());
		idSchemeCodeService.modifyIdSchemeProductCode(idSchemeCodeVo);
		return makeResponseEntity(new ResultIdVo(idSchemeCodeVo.getIdSchmCd()));
	}
	
	
	@Operation(summary="식별체계 - 객체 - 시설 코드 목록 조회")
	@GetMapping("/api/v1/schema/facilitycodes")
	public ResponseEntity<Object> getIdSchemeFacilityCodeList(IdSchemeSearchVo searchVo) {
		return makeResponseEntity(idSchemeCodeService.getIdSchemeFacilityCodeList(searchVo));
	}
	
	@Operation(summary="식별체계 - 객체 - 시설 코드 상세 조회")
	@GetMapping("/api/v1/schema/facilitycodes/{idSchmCd}")	
	public ResponseEntity<Object> getIdSchemeFacilityCode(
			@Parameter(name="idSchmCd", description="식별체계 코드") @PathVariable String idSchmCd) {
		
		IdSchemeCodeDto dto = idSchemeCodeService.getIdSchemeFacilityCode(idSchmCd);
		if (dto == null) throw new ResNotFoundException("객체 - 시설 코드 데이터가 존재하지 않습니다.");

		return makeResponseEntity(dto);
	}
	
	@Operation(summary="식별체계 - 객체 - 시설 코드 등록")
	@PostMapping("/api/v1/schema/facilitycodes")
	public ResponseEntity<Object> createIdSchemeFacilityCode(@RequestBody IdSchemeCodeVo idSchemeCodeVo) {
		log.debug(idSchemeCodeVo.toString());
		String result = idSchemeCodeService.createIdSchemeFacilityCode(idSchemeCodeVo);	
		return makeResponseEntity(new ResultIdVo(result), HttpStatus.CREATED, "/api/v1/schema/facilitycodes/" + result);
	}
	
	@Operation(summary="식별체계 - 객체 - 시설 코드 수정")
	@PutMapping("/api/v1/schema/facilitycodes/{idSchmCd}")
	public ResponseEntity<Object> modifyIdSchemeFacilityCode(
			@Parameter(name="idSchmCd", description="식별체계 코드") @PathVariable String idSchmCd, @RequestBody IdSchemeCodeVo idSchemeCodeVo) {
		
		log.debug(idSchemeCodeVo.toString());
		compareUniqueId(idSchmCd, idSchemeCodeVo.getIdSchmCd());
		idSchemeCodeService.modifyIdSchemeFacilityCode(idSchemeCodeVo);
		return makeResponseEntity(new ResultIdVo(idSchemeCodeVo.getIdSchmCd()));
	}
	
}
