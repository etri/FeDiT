package kr.co.n2m.platform.meta.portal.countrycode.controller;

import java.util.Map;

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
import kr.co.n2m.platform.meta.portal.countrycode.domain.CountryCodeSearchVo;
import kr.co.n2m.platform.meta.portal.countrycode.domain.CountryCodeVo;
import kr.co.n2m.platform.meta.portal.countrycode.service.CountryCodeService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "국가코드", description = "국가코드 API")
@Slf4j
@RestController
public class CountryCodeController extends ResponseComponent  {

	@Autowired
	private CountryCodeService countryCodeService;
	
	/** 국가코드 관리 페이징 목록 조회 */
	@Operation(summary="국가코드 페이징 목록 조회")
	@GetMapping("/api/v1/portal/countrycodes")
	public ResponseEntity<Object> getCountryCodeList(CountryCodeSearchVo searchVo) {
		
		log.debug(searchVo.toString());
		return makeResponseEntity(countryCodeService.getCountryCodeList(searchVo));
	}
	
	/** 국가코드 상세 조회 */
	@Operation(summary="국가코드 상세 조회")
	@GetMapping("/api/v1/portal/countrycodes/{cntryCd}")
	public ResponseEntity<Object> getCountryCode(
			@Parameter(name="cntryCd", description="국가코드") @PathVariable String cntryCd) {
		
		CountryCodeVo vo = countryCodeService.getCountryCode(cntryCd);
		if (vo == null) throw new ResNotFoundException("국가코드가 존재하지 않습니다.");
		return makeResponseEntity(vo);
	}
	
	/** 국가코드 등록 */
	@Operation(summary="국가코드 등록")
	@PostMapping("/api/v1/portal/countrycodes")
	public ResponseEntity<Object> createCountrycode(@RequestBody CountryCodeVo countryCodeVo) {
		
		log.debug(countryCodeVo.toString());
		String newId = countryCodeService.createCountryCode(countryCodeVo);
		return makeResponseEntity(new ResultIdVo(newId), HttpStatus.CREATED,  "/api/v1/portal/countrycodes/" + newId);
	}

	/** 국가코드 수정 */
	@Operation(summary="국가코드 수정")
	@PutMapping("/api/v1/portal/countrycodes/{cntryCd}")
	public ResponseEntity<Object> modifyCountrycode(
			@Parameter(name="cntryCd", description="국가코드") @PathVariable String cntryCd, @RequestBody CountryCodeVo countryCodeVo) {
		
		log.debug(countryCodeVo.toString());
		compareUniqueId(cntryCd, countryCodeVo.getCntryCd());
		countryCodeService.modifyCountryCode(countryCodeVo);
		return makeResponseEntity(new ResultIdVo(cntryCd));
	}
	
	/** 국가코드 중복체크 */
	@Operation(summary="국가코드 중복체크")
	@GetMapping("/api/v1/portal/countrycodes/check")
	public ResponseEntity<Object> checkCountrycode(CountryCodeVo countryCodeVo) {
		Map<String, Boolean> resMap = countryCodeService.checkCountrycode(countryCodeVo);
		return makeResponseEntity(resMap);
	}
}
