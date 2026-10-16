package kr.co.n2m.platform.admin.feature.platform.controller;

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

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import kr.co.n2m.platform.admin.feature.platform.entity.Platform;
import kr.co.n2m.platform.admin.feature.platform.service.PlatformService;

@RestController
@Api(tags = "플랫폼 관리")
@ApiResponses(value = {
		@ApiResponse(code = 404, message = "Not Found"),
		@ApiResponse(code = 500, message = "Internal Server Errpor") 
}) 
public class PlatformController { 
	
	@Autowired 
	private PlatformService platformService;

	/** 플랫폼 매핑된 메뉴 목록 조회. */
	@ApiOperation(value = "플랫폼 목록 조회(페이징 처리)", notes = "<strong>플랫폼 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value = "/platformPaging")
	public ResponseEntity<Map<String, Object>> getPlatformListByPaging(Platform searchVo) {
		Map<String, Object> resultList = platformService.getPlatformListByPaging(searchVo);
		return new ResponseEntity<Map<String,Object>>(resultList, HttpStatus.OK);
	}
	
	/** 플랫폼 목록 조회. */
    @ApiOperation(value = "플랫폼 목록 조회", notes = "<strong>플랫폼 목록을 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code = 200, message= "OK")})
    @GetMapping(value="/platform")
	public ResponseEntity<List<Platform>> getPlatformList(Platform searchVo) {
		List<Platform> listPlatform = platformService.getPlatformList(searchVo);
		return new ResponseEntity<List<Platform>>(listPlatform, HttpStatus.OK);
	}
    

	/** 플랫폼 상세 조회. */
	@ApiOperation(value = "플랫폼 상세 조회", notes = "<strong>플랫폼 상세 페이지를 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value="/platform/{pltfrmId}")
	public ResponseEntity<Platform> getPlatformDetail(@PathVariable(name="pltfrmId", required = true) String pltfrmId) {
		Platform platformVo = platformService.getPlatformDetail(pltfrmId);
		return new ResponseEntity<Platform>(platformVo, HttpStatus.OK);
	}
	
	/** 플랫폼 생성. */
	@ApiOperation(value = "플랫폼 생성", notes = "<strong>플랫폼을 생성합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "OK"), @ApiResponse(code = 409, message = "ID 중복") })
	@PostMapping(value = "/platform", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Platform> createPlatform(@RequestBody Platform platformVo) throws URISyntaxException {
		String pltfrmId = platformService.createPlatform(platformVo);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/platform/" + pltfrmId));
		
		if(pltfrmId != null) {
			return new ResponseEntity<Platform>(responseHeaders, HttpStatus.CREATED);
		} else {
			return new ResponseEntity<Platform>(HttpStatus.CONFLICT);
		}
	}
	
	/** 플랫폼 그룹 수정. */
	@ApiOperation(value = "플랫폼 수정", notes = "<strong>플랫폼을 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공"), @ApiResponse(code = 409, message = "ID 중복")})
	@PutMapping(value = "/platform/{pltfrmId}", consumes= MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> modifyPlatform(@RequestBody Platform platformVo) throws URISyntaxException {
		String pltfrmId = platformService.modifyPlatform(platformVo);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/platform/" + pltfrmId));
		
		if(platformVo.getPltfrmId().equals(pltfrmId)) {
			return new ResponseEntity<Object>(HttpStatus.OK);
		} else {
			return new ResponseEntity<Object>(HttpStatus.CONFLICT);
		}
	}
	
	/** 플랫폼 삭제 */
	@ApiOperation(value = "플랫폼 삭제", notes = "<strong>플랫폼을 삭제합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/platform/{pltfrmId}")
	public ResponseEntity<Object> removePlatform(@PathVariable(name = "pltfrmId") String pltfrmId) {
		platformService.removePlatform(pltfrmId);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
}
