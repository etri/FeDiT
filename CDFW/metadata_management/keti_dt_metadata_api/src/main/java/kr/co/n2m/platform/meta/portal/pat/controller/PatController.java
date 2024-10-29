package kr.co.n2m.platform.meta.portal.pat.controller;

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
import kr.co.n2m.platform.meta.portal.pat.domain.PatVo;
import kr.co.n2m.platform.meta.portal.pat.service.PatService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "PAT 관리", description = "PAT 관리 API")
@Slf4j
@RestController
public class PatController extends ResponseComponent {
	
	@Autowired
	PatService patService;

	
	/**
	 * 내 PAT 조회
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patkId
	 * @return
	 */
	@Operation(summary="내 PAT 조회")
	@GetMapping("/api/v1/portal/pats/{patkId}")
	public ResponseEntity<Object> getPat(@PathVariable String patkId) {
		return makeResponseEntity(patService.getPat(patkId));
	}
	
	/**
	 * 내 PAT 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06. 
	 * @param patkId
	 * @return
	 */
	@Operation(summary="내 PAT 삭제")
	@DeleteMapping("/api/v1/portal/pats/{patkId}")
	public ResponseEntity<Object> deletePat(@PathVariable String patkId) {
		patService.deletePat(patkId);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	/** 
	 * 내 PAT 등록 
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patkId
	 * @return
	 */
	@Operation(summary="내 PAT 등록")
	@PostMapping("/api/v1/portal/pats")
	public ResponseEntity<Object> createPat(@RequestBody PatVo patVo) {

		log.debug(patVo.toString());
		String newId = patService.createPat(patVo);
		return makeResponseEntity(new ResultIdVo(newId), HttpStatus.CREATED, "/api/v1/portal/pats/" + newId);
	}
	
}
