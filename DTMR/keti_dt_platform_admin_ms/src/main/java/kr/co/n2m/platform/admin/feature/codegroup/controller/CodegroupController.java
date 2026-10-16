package kr.co.n2m.platform.admin.feature.codegroup.controller;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import kr.co.n2m.platform.admin.feature.codegroup.entity.Code;
import kr.co.n2m.platform.admin.feature.codegroup.entity.Codegroup;
import kr.co.n2m.platform.admin.feature.codegroup.service.CodegroupService;

@RestController
@Api(tags="코드 그룹")
@ApiResponses({
    @ApiResponse(code= 404, message= "페이지를 찾을 수 없습니다."),
    @ApiResponse(code= 500, message= "내부 서버 오류가 발생하였습니다.")
})
public class CodegroupController {

	@Autowired
	private CodegroupService codegroupService;
	
	/** 코드 그룹 페이징 목록 조회 */
	@ApiOperation(value = "코드 그룹 페이징 목록 조회", notes = "<strong>코드 그룹 페이징 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@GetMapping(value = "/codegroupPaging")
	public ResponseEntity<Map<String, Object>> getCodegroupListByPaging(Codegroup searchVo) {
		Map<String, Object> listResult = codegroupService.getCodegroupListByPaging(searchVo);
		return new ResponseEntity<Map<String, Object>>(listResult, HttpStatus.OK);
	}
	
	/** 코드 그룹 목록 조회*/
	@GetMapping(value="/codegroup")
    @ApiOperation(value="코드 그룹 목록 조회", notes="<strong>코드 그룹 목록을 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	public ResponseEntity<List<Codegroup>> getCodegroupList(Codegroup searchVo) {
		List<Codegroup> listCodegroup=codegroupService.getCodegroupList(searchVo);
		return new ResponseEntity<List<Codegroup>>(listCodegroup, null, HttpStatus.OK);
	}
	
	/** 코드 그룹 상세 조회*/
	@GetMapping(value="/codegroup/{grpId}")
	@ApiOperation(value="코드 그룹 상세 조회", notes="<strong>코드 그룹 상세 페이지를 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParam(name = "grpId", value="코드 그룹 ID" ,required = true)
	public ResponseEntity<Object> getCodegroupDetail(@PathVariable(name="grpId") String grpId) {
		Codegroup codegroupVo=codegroupService.getCodegroupDetail(grpId);
		return new ResponseEntity<Object>(codegroupVo, null, HttpStatus.OK);
	}
	
	/** 코드 그룹 생성*/
	@PostMapping(value="/codegroup", consumes= MediaType.APPLICATION_JSON_VALUE)
	@ApiOperation(value="코드 그룹 생성", notes="<strong>코드 그룹을 생성합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 201, message= "요청 성공"), @ApiResponse(code = 409, message = "ID 중복")})
	public ResponseEntity<Codegroup> createCodegroup(@RequestBody Codegroup codegroupVo) throws URISyntaxException {
		String grpId=codegroupService.createCodegroup(codegroupVo);
		
		if(grpId != null) {
			HttpHeaders responseHeaders=new HttpHeaders();
			responseHeaders.setLocation(new URI("/codegroup/" + grpId));
			
			return new ResponseEntity<Codegroup>(HttpStatus.CREATED);
		}else {
			return new ResponseEntity<Codegroup>(HttpStatus.CONFLICT);
		}
	}
	
	/** 코드 그룹 수정*/
	@PutMapping(value="/codegroup/{grpId}", consumes= MediaType.APPLICATION_JSON_VALUE)
	@ApiOperation(value="코드 그룹 수정", notes="<strong>코드 그룹을 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 201, message= "요청 성공"), @ApiResponse(code = 409, message = "ID 중복")})
	public ResponseEntity<Object> modifyCodegroup(@RequestBody Codegroup codegroupVo) throws URISyntaxException {
		String grpId=codegroupService.modifyCodegroup(codegroupVo);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/codegroup/" + grpId));
		
		if(codegroupVo.getGrpId().equals(grpId)) {
			return new ResponseEntity<Object>(HttpStatus.OK);
		}else {
			return new ResponseEntity<Object>(HttpStatus.CONFLICT);
		}
	}
	
	/** 코드 그룹 삭제*/
	@DeleteMapping(value="/codegroup/{grpId}")
	@ApiOperation(value="코드 그룹 삭제", notes="<strong>코드 그룹을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	@ApiImplicitParam(name = "grpId", value="코드 그룹 ID" ,required = true)
	public ResponseEntity<Object> removeCodegroup(@PathVariable(name="grpId") String grpId) {
		codegroupService.removeCodegroup(grpId);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	/** 코드 그룹 전체 삭제*/
	@DeleteMapping(value="/codegroupData/{grpId}")
	@ApiOperation(value="코드 그룹 삭제", notes="<strong>코드 그룹을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	@ApiImplicitParam(name = "grpId", value="코드 그룹 ID" ,required = true)
	public ResponseEntity<Object> removeCodegroupData(@PathVariable(name="grpId") String grpId) {
		codegroupService.removeCodegroupAllData(grpId);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	
	/************************ CODE **************************/
	
	
	/** 코드 목록 조회*/
	@GetMapping(value="/codegroup/{grpId}/codes")
	@ApiOperation(value="코드 목록 조회", notes="<strong>코드 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParam(name = "grpId", value="코드 그룹 ID" ,required = true)
	public ResponseEntity<List<Code>> getCodegroupCodeList(@PathVariable(name="grpId") String grpId, Code searchVo){
		List<Code> listCode=codegroupService.getCodeList(searchVo);
		return new ResponseEntity<List<Code>>(listCode, null, HttpStatus.OK);
	}
	
	/** 워크플로우 코드 목록 조회*/
	@GetMapping(value="/codegroup/wflowCodes")
	@ApiOperation(value="코드 목록 조회", notes="<strong>코드 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParam(name = "grpId", value="코드 그룹 ID" ,required = true)
	public ResponseEntity<List<Map<String, Object>>> getWflowCodeList(@RequestParam("grpIds") List<String> grpIds, Code searchVo){
		List<Map<String, Object>> list = codegroupService.getWflowCodeList(grpIds,searchVo);
		return new ResponseEntity<List<Map<String, Object>>>(list, HttpStatus.OK);
	}
	
	/** 코드 상세 조회*/
	@GetMapping(value="/codegroup/{grpId}/codes/{cdId}")
	@ApiOperation(value="코드 상세 조회", notes="<strong>코드 상세 페이지를 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "cdId", value="코드 ID" ,required = true),
		@ApiImplicitParam(name = "grpId", value="코드 그룹 ID" ,required = true),
	})
	public ResponseEntity<Object> getCodegroupCodeDetail(@PathVariable(name="grpId") String grpId, @PathVariable(name="cdId") String cdId) {
		Code codeVo=codegroupService.getCodeDetail(cdId);
		return new ResponseEntity<Object>(codeVo, null, HttpStatus.OK);
	}

	/** 코드 생성*/
	@ApiOperation(value = "코드 생성", notes = "<strong>코드를 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공"), @ApiResponse(code = 409, message = "ID 중복") })
	@PostMapping(value = "/codegroup/{grpId}/codes", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Code> createCode(@PathVariable(name = "grpId") String grpId, @RequestBody Code codeVo) throws URISyntaxException {
		String cdId = codegroupService.createCode(grpId, codeVo);
		
		if (cdId != null) {
			HttpHeaders responseHeaders=new HttpHeaders();
			responseHeaders.setLocation(new URI("/codegroup/" + grpId + "/codes/" + cdId));
			
			return new ResponseEntity<Code>(HttpStatus.OK);
		} else {
			return new ResponseEntity<Code>(HttpStatus.CONFLICT);
		}
	}

	/** 코드 수정*/
	@PutMapping(value="/codegroup/{grpId}/codes/{cdId}", consumes= MediaType.APPLICATION_JSON_VALUE)
	@ApiOperation(value="코드 수정", notes="<strong>코드를 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 201, message= "요청 성공"), @ApiResponse(code = 409, message = "ID 중복")})
	public ResponseEntity<Object> modifyCode(@PathVariable(name="grpId") String grpId, @RequestBody Code codeVo) throws URISyntaxException {
		String cdId= codegroupService.modifyCode(grpId, codeVo);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/codegroup/" + grpId + "/codes/" + cdId));
		
		if(codeVo.getGrpId().equals(grpId)) {
			return new ResponseEntity<Object>(HttpStatus.OK);
    	}else {
    		return new ResponseEntity<Object>(HttpStatus.CONFLICT);
    	}
	}
	
	/**코드 전체 삭제*/
	@DeleteMapping(value="/codegroup/{grpId}/codes")
	@ApiOperation(value="코드 전체 삭제", notes="<strong>코드를 전체 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	@ApiImplicitParam(name = "grpId", value="코드 그룹 ID" ,required = true)
	public ResponseEntity<Object> removeCodes(@PathVariable(name="grpId") String grpId) {
		codegroupService.removeCodeByCodegroupOid(grpId);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	/** 코드 삭제*/
	@DeleteMapping(value="/codegroup/{grpId}/codes/{cdId}")
	@ApiOperation(value="코드 삭제", notes="<strong>코드를 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "cdId", value="코드 ID" ,required = true),
		@ApiImplicitParam(name = "grpId", value="코드 그룹 ID" ,required = true),
	})
	public ResponseEntity<Object> removeCode(@PathVariable(name="grpId") String grpId, @PathVariable(name="cdId") String cdId) {
		codegroupService.removeCode(grpId, cdId);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

}
