package kr.co.n2m.platform.admin.feature.apigroup.controller;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;

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
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import kr.co.n2m.platform.admin.feature.apigroup.entity.Api;
import kr.co.n2m.platform.admin.feature.apigroup.entity.Apigroup;
import kr.co.n2m.platform.admin.feature.apigroup.service.ApigroupService;


@RestController
@io.swagger.annotations.Api(tags = "API 그룹")
@ApiResponses(value = {
		@ApiResponse(code = 404, message = "Not Found"),
		@ApiResponse(code = 500, message = "Internal Server Errpor") 
}) 
public class ApigroupController {

	@Autowired
	private ApigroupService apigroupService;
	
	/** API 그룹 페이징 목록 조회*/
	@ApiOperation(value="API 그룹 목록 조회(페이징 처리)", notes="<strong>API 그룹 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@GetMapping(value="/apigroupPaging")
	public ResponseEntity<Map<String, Object>> getApigroupListByPaging(Apigroup searchVo) {
		Map<String, Object> resultList = apigroupService.getApigroupListByPaging(searchVo);
		return new ResponseEntity<Map<String,Object>>(resultList, HttpStatus.OK);
	}
	
	/** API 그룹 목록 조회*/
    @ApiOperation(value="API 그룹 목록 조회", notes="<strong>API 그룹 목록을 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
    @GetMapping(value="/apigroup")
	public ResponseEntity<List<Apigroup>> getApigroupList(Apigroup searchVo) {
		List<Apigroup> listApigroup = apigroupService.getApigroupList(searchVo);
		return new ResponseEntity<List<Apigroup>>(listApigroup, HttpStatus.OK);
	}
    

	/** API 그룹 상세 조회*/
	@ApiOperation(value="API 그룹 상세 조회", notes="<strong>API 그룹 상세 페이지를 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@GetMapping(value="/apigroup/{grpOid}")
	public ResponseEntity<Apigroup> getApigroupDetail(@PathVariable(name="grpOid", required = true) String grpOid) {
		Apigroup apigroupVo = apigroupService.getApigroupDetail(grpOid);
		return new ResponseEntity<Apigroup>(apigroupVo, HttpStatus.OK);
	}
	
	/** API 그룹 생성*/
	@ApiOperation(value="API 그룹 생성", notes="<strong>API 그룹을 생성합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@PostMapping(value="/apigroup", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Apigroup> createApigroup(@RequestBody Apigroup apigroupVo) throws URISyntaxException {
		String apigroupOid = apigroupService.createApigroup(apigroupVo);

		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/apigroup/" + apigroupOid));

		return new ResponseEntity<Apigroup>(responseHeaders, HttpStatus.CREATED);
	}
	
	/** API 그룹 수정*/
	@ApiOperation(value="API 그룹 수정", notes="<strong>API 그룹을 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "요청 성공")})
    @PutMapping(value="/apigroup/{grpOid}", consumes = MediaType.APPLICATION_JSON_VALUE) 
	public ResponseEntity<Object> modifyApigroup(@PathVariable (name = "grpOid") String grpOid, @RequestBody Apigroup apigroupVo) throws URISyntaxException {
		apigroupVo.setGrpOid(grpOid);
		apigroupService.modifyApigroup(apigroupVo);
		
		HttpHeaders responHeaders = new HttpHeaders();
		responHeaders.setLocation(new URI("/apigroup/" + grpOid));
		
		return new ResponseEntity<Object>(HttpStatus.OK); 
	}

	/** API 그룹 + API 삭제*/
	@ApiOperation(value="API 그룹 삭제", notes="<strong>API 그룹을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	@DeleteMapping(value="/apigroup/{grpOid}")
	public ResponseEntity<Object> removeApigroup(@PathVariable(name="grpOid") String grpOid) {
		apigroupService.removeApigroup(grpOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	
	/************************************ API ************************************/
	
	/** API 페이징 목록 조회*/
	@ApiOperation(value="API 목록 조회(페이징 처리)", notes="<strong>API 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@GetMapping(value="/apigroup/{grpOid}/apiPaging")
	public ResponseEntity<Map<String, Object>> getApiListByPaging(@PathVariable(name = "grpOid") String grpOid, Api apiVo) {
		apiVo.setGrpOid(grpOid);
		Map<String, Object> resultList = apigroupService.getApiListByPaging(apiVo);
		return new ResponseEntity<Map<String,Object>>(resultList, HttpStatus.OK);
	}
		
	/** API 목록 조회*/
	@ApiOperation(value="API 목록 조회", notes="<strong>API 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@GetMapping(value="/apigroup/{grpOid}/api")
	public ResponseEntity<List<Api>> getApiList(@PathVariable(name = "grpOid") String grpOid, Api apiVo) {
		List<Api> listApi = apigroupService.getApiList(apiVo);
		return new ResponseEntity<List<Api>>(listApi, HttpStatus.OK);
	}
	
	/** API 상세 조회*/
	@ApiOperation(value="API 상세 조회", notes="<strong>API 상세 페이지를 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@GetMapping(value="/apigroup/{grpOid}/api/{apiOid}")
	public ResponseEntity<Api> getApigroupApiDetail(@PathVariable(name="grpOid") String grpOid, 
			@PathVariable(name="apiOid") String apiOid) {
		Api searchApi = new Api();
		searchApi.setGrpOid(grpOid);
		searchApi.setApiOid(apiOid);
		
		Api apiVo = apigroupService.getApiDetail(searchApi);
		
		return new ResponseEntity<Api>(apiVo, HttpStatus.OK);
	}
	
	/** API 생성*/
	@ApiOperation(value="API 생성", notes="<strong>API를 생성합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 201, message= "요청 성공")})
	@PostMapping(value="/apigroup/{grpOid}/api", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Api> createApi(@PathVariable(name="grpOid") String grpOid, @RequestBody Api apiVo) throws URISyntaxException {
		String apiOid = apigroupService.createApi(grpOid, apiVo);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/apigroup/" + grpOid + "/api/" + apiOid));

		return new ResponseEntity<Api>(responseHeaders, HttpStatus.CREATED);
	}
	
	/** API 수정*/
	@ApiOperation(value="API 수정", notes="<strong>API를 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 201, message= "요청 성공")})
	@PutMapping(value="/apigroup/{grpOid}/api/{apiOid}", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> modifyApi(@PathVariable(name="grpOid") String grpOid, @PathVariable(name="apiOid") String apiOid, @RequestBody Api apiVo) throws URISyntaxException {
		apigroupService.modifyApi(grpOid, apiVo);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/apigroup/" + grpOid + "/api/" + apiOid ));
		
		return new ResponseEntity<Object>(HttpStatus.OK);
	}

	@ApiOperation(value="API 삭제", notes="<strong>API를 삭제합니다.</strong>", response=Api.class)
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	@DeleteMapping(value="/apigroup/{grpOid}/api/{apiOid}")
	public ResponseEntity<Object> removeApi(@PathVariable(name="grpOid") String grpOid, @PathVariable(name="apiOid") String apiOid) {
		apigroupService.removeApi(apiOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	 
}




