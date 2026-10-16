package kr.co.n2m.platform.meta.portal.code.controller;

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
import kr.co.n2m.platform.meta.portal.code.domain.CodeGroupVo;
import kr.co.n2m.platform.meta.portal.code.domain.CodeSearchVo;
import kr.co.n2m.platform.meta.portal.code.domain.CodeVo;
import kr.co.n2m.platform.meta.portal.code.service.CodeGroupService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "메타데이터코드", description = "메타데이터코드 API")
@Slf4j
@RestController
public class CodeGroupController extends ResponseComponent {
	
	@Autowired
	private CodeGroupService codeGroupService;
	
	/** 코드그룹 페이징 목록 조회 */
	@Operation(summary="코드그룹 목록 조회")
	@GetMapping("/api/v1/portal/codegroups")
	public ResponseEntity<Object> getCodeGroupList(CodeSearchVo searchVo) {
		
		log.debug(searchVo.toString());
		return makeResponseEntity(codeGroupService.getCodeGroupList(searchVo));
	}
	
	/** 코드그룹 상세 조회 */
	@Operation(summary="코드그룹 조회")
	@GetMapping("/api/v1/portal/codegroups/{mtcdGrpId}")
	public ResponseEntity<Object> getCodeGroup(
			@Parameter(name="mtcdGrpId", description="메타코드그룹ID") @PathVariable String mtcdGrpId) {
		
		CodeGroupVo vo = codeGroupService.getCodeGroup(mtcdGrpId);
		if (vo == null) throw new ResNotFoundException("코드그룹 데이터가 존재하지 않습니다.");
		
		return makeResponseEntity(vo);
	}
	
	/** 코드그룹 등록 */
	@Operation(summary="코드그룹 등록")
	@PostMapping("/api/v1/portal/codegroups")
	public ResponseEntity<Object> createCodeGroup(@RequestBody CodeGroupVo codeGroupVo) {
		
		log.debug(codeGroupVo.toString());
		String newId = codeGroupService.createCodeGroup(codeGroupVo);
		
		return makeResponseEntity(new ResultIdVo(newId), HttpStatus.CREATED, "/api/v1/portal/codegroups/" + newId);
	}
	
	/** 코드그룹 수정 */
	@Operation(summary="코드그룹 수정")
	@PutMapping("/api/v1/portal/codegroups/{mtcdGrpId}")
	public ResponseEntity<Object> modifyCodeGroup(
			@Parameter(name="mtcdGrpId", description="메타코드그룹ID") @PathVariable String mtcdGrpId, @RequestBody CodeGroupVo codeGroupVo) {
		
		log.debug(codeGroupVo.toString());
		compareUniqueId(mtcdGrpId, codeGroupVo.getMtcdGrpId());
		codeGroupService.modifyCodeGroup(codeGroupVo);
		return makeResponseEntity(new ResultIdVo(mtcdGrpId));
	}
	
	/** 코드목록 조회 */
	@Operation(summary="코드 목록 조회")
	@GetMapping({"/api/v1/portal/codegroups/{mtcdGrpId}/codes", "/api/v1/public/codegroups/{mtcdGrpId}/codes"})
	public ResponseEntity<Object> getCodeList(
			@Parameter(name="mtcdGrpId", description="메타코드그룹ID") @PathVariable String mtcdGrpId, CodeSearchVo searchVo) {
		searchVo.setMtcdGrpId(mtcdGrpId);
		return makeResponseEntity(codeGroupService.getCodeList(searchVo));
	}
	
	/** 코드목록 상세조회 */
	@Operation(summary="코드 조회")
	@GetMapping("/api/v1/portal/codegroups/{mtcdGrpId}/codes/{mtcd}")
	public ResponseEntity<Object> getCode(
			@Parameter(name="mtcdGrpId", description="메타코드그룹ID") @PathVariable String mtcdGrpId,
			@Parameter(name="mtcd", description="메타코드") @PathVariable String mtcd) {
	
		CodeVo codeVo = new CodeVo();
		codeVo.setMtcdGrpId(mtcdGrpId);
		codeVo.setMtcd(mtcd);
		CodeVo vo = codeGroupService.getCode(codeVo);
		if (vo == null) throw new ResNotFoundException("코드 데이터가 존재하지 않습니다.");
		
		return makeResponseEntity(vo);
	}
	
	/** 코드 등록 */
	@Operation(summary="코드 등록")
	@PostMapping("/api/v1/portal/codegroups/{mtcdGrpId}/codes")
	public ResponseEntity<Object> createCode(
			@Parameter(name="mtcdGrpId", description="메타코드그룹ID") @PathVariable String mtcdGrpId, @RequestBody CodeVo codeVo) {
		
		codeVo.setMtcdGrpId(mtcdGrpId);
		log.debug(codeVo.toString());
		String newId = codeGroupService.createCode(codeVo);
		
		return makeResponseEntity(new ResultIdVo(newId), HttpStatus.CREATED, "/api/v1/portal/codegroups/" + mtcdGrpId + "/codes/" + newId);
	}
	
	/** 코드 수정 */
	@Operation(summary="코드 수정")
	@PutMapping("/api/v1/portal/codegroups/{mtcdGrpId}/codes/{mtcd}")
	public ResponseEntity<Object> modifyCode(
			@Parameter(name="mtcdGrpId", description="메타코드그룹ID") @PathVariable String mtcdGrpId, 
			@Parameter(name="mtcd", description="메타코드") @PathVariable String mtcd, @RequestBody CodeVo codeVo) {
	
		log.debug(codeVo.toString());
		compareUniqueId(mtcdGrpId, codeVo.getMtcdGrpId());
		compareUniqueId(mtcd, codeVo.getMtcd());
		codeGroupService.modifyCode(codeVo);
		
		return makeResponseEntity(new ResultIdVo(mtcd));
	}
	
	/** 코드그룹ID 중복체크 */
	@Operation(summary="코드그룹ID 중복체크")
	@GetMapping("/api/v1/portal/codegroups/check")
	public ResponseEntity<Object> checkCodeGroupId(CodeGroupVo codeGroupVo) {
		Map<String, Boolean> resMap = codeGroupService.checkCodeGroupId(codeGroupVo);
		return makeResponseEntity(resMap);
	}
	
	/** 코드ID 중복체크 */
	@Operation(summary="코드ID 중복체크")
	@GetMapping("/api/v1/portal/codegroups/{mtcdGrpId}/codes/check")
	public ResponseEntity<Object> checkCodeId(
			@Parameter(name="mtcdGrpId", description="메타코드그룹ID") @PathVariable String mtcdGrpId, CodeVo codeVo) {
		
		codeVo.setMtcdGrpId(mtcdGrpId);
		Map<String, Boolean> resMap = codeGroupService.checkCodeId(codeVo);
		return makeResponseEntity(resMap);
	}
	
}
