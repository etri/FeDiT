package kr.co.n2m.platform.admin.feature.auth.controller;

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
import kr.co.n2m.platform.admin.feature.apigroup.entity.Apigroup;
import kr.co.n2m.platform.admin.feature.auth.entity.Auth;
import kr.co.n2m.platform.admin.feature.auth.entity.AuthApi;
import kr.co.n2m.platform.admin.feature.auth.entity.AuthMenu;
import kr.co.n2m.platform.admin.feature.auth.entity.AuthUser;
import kr.co.n2m.platform.admin.feature.auth.service.AuthService;
import kr.co.n2m.platform.admin.feature.menu.entity.Menu;
import kr.co.n2m.platform.admin.feature.user.entity.User;

@RestController
@Api(tags = "권한 관리")
@ApiResponses(value = { @ApiResponse(code = 404, message = "Not Found"),
		@ApiResponse(code = 500, message = "Internal Server Error") })
public class AuthController {

	@Autowired
	private AuthService authService;

	/** 권한 목록 페이징 조회 */
	@ApiOperation(value = "권한 목록 조회(페이징 처리)", notes = "<strong>권한 목록을 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/authPaging")
	public ResponseEntity<Map<String, Object>> getAuthListByPaging(Auth searchVo) {
		Map<String, Object> resultList = authService.getAuthListByPaging(searchVo);
		return new ResponseEntity<Map<String, Object>>(resultList, HttpStatus.OK);
	}

	/** 권한 목록 조회 */
	@ApiOperation(value = "권한 목록 조회", notes = "<strong>권한 목록을 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/auth")
	public ResponseEntity<List<Auth>> getAuthList(Auth searchVo) {
		List<Auth> listAuth = authService.getAuthList(searchVo);
		return new ResponseEntity<List<Auth>>(listAuth, HttpStatus.OK);
	}

	/** 권한 상세 조회 */
	@ApiOperation(value = "권한 상세 조회", notes = "<strong>권한 목록을 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/auth/{autOid}")
	public ResponseEntity<Auth> getAuth(@PathVariable(name = "autOid", required = true) String autOid) {
		Auth result = authService.getAuth(autOid);
		return new ResponseEntity<Auth>(result, HttpStatus.OK);
	}

	/** 권한 생성 */
	@ApiOperation(value = "권한 생성", notes = "<strong>권한을 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공") })
	@PostMapping(value = "/auth", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Auth> createAuth(@RequestBody Auth authVo) throws URISyntaxException {
		String oid = authService.createAuth(authVo);

		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/auth/" + oid));

		return new ResponseEntity<Auth>(responseHeaders, HttpStatus.CREATED);
	}

	/** 권한 수정 */
	@ApiOperation(value = "권한 수정", notes = "<strong>권한을 수정합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@PutMapping(value = "/auth/{autOid}", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> modifyAuth(@PathVariable(name = "autOid") String autOid, @RequestBody Auth authVo)
			throws URISyntaxException {
		authVo.setAutOid(autOid);
		authService.modifyAuth(authVo);
		return new ResponseEntity<Object>(HttpStatus.OK);
	}

	/** 권한 삭제 */
	@ApiOperation(value = "권한 삭제", notes = "<strong>권한을 삭제합니다.</strong>", response = Auth.class)
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/auth/{autOid}")
	public ResponseEntity<Object> removeAuth(@PathVariable(name = "autOid") String autOid) {
		authService.removeAuth(autOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	/** 권한 + user, menu, api 삭제 */
	@ApiOperation(value = "권한 삭제", notes = "<strong>권한에 대한 모든 데이터를 삭제합니다.</strong>", response = Auth.class)
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/authData/{autOid}")
	public ResponseEntity<Object> removeAuthData(@PathVariable(name = "autOid") String autOid) {
		authService.removeAuthData(autOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	/** 슈퍼 관리자 조회 */
	@ApiOperation(value = "슈퍼 관리자 조회", notes = "<strong>슈퍼 관리자를 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/auth/admin")
	public ResponseEntity<Object> getSuperAdmin() {
		String result = authService.getSuperAdmin();
		return new ResponseEntity<Object>(result, HttpStatus.OK);
	}

	/**************************************
	 * 권한 사용자
	 **************************************/

	/** 권한 사용자 조회 */
	@ApiOperation(value = "권한 사용자 조회", notes = "<strong>권한 사용자를 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/auth/{autOid}/users")
	public ResponseEntity<Object> getAuthUserList(@PathVariable(name = "autOid") String autOid, AuthUser user) {
		List<AuthUser> listUser = authService.getUserList(user);
		return new ResponseEntity<Object>(listUser, HttpStatus.OK);
	}

	/** 권한 사용자 상세 조회 */
	@ApiOperation(value = "권한 사용자 상세 조회", notes = "<strong>권한 사용자를 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/auth/{autOid}/user/{userOid}")
	public ResponseEntity<Object> getAuthUser(@PathVariable(name = "autOid") String autOid,
			@PathVariable(name = "userid") String userid) {
		AuthUser searchAuthUser = new AuthUser();
		searchAuthUser.setAutOid(autOid);
		searchAuthUser.setUserid(userid);

		AuthUser resultUser = authService.getUserDetail(searchAuthUser);

		return new ResponseEntity<Object>(resultUser, HttpStatus.OK);
	}

	/** 권한 사용자 OID 생성 */
	@ApiOperation(value = "권한 사용자 단건 생성", notes = "<strong>권한 사용자을 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공") })
	@PostMapping(value = "/auth/{autOid}/user", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> createAuthUser(@PathVariable(name = "autOid") String autOid, @RequestBody AuthUser userVo) throws URISyntaxException {
		String userOid = authService.createUserOid(autOid, userVo);

		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/auth/" + autOid + "/user/" + userOid));
		
		if(userOid != null) {
			return new ResponseEntity<Object>(HttpStatus.CREATED);
		}
		else {
			return new ResponseEntity<Object>(HttpStatus.CONFLICT);
		}
	}

	/** 권한 사용자(멀티) Oid 생성 */
	@ApiOperation(value = "권한 사용자 멀티 생성", notes = "<strong>권한 사용자들을 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공") })
	@PostMapping(value = "/auth/{autOid}/users", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> createAuthUsers(@PathVariable(name = "autOid") String autOid, @RequestBody List<AuthUser> authuser) throws URISyntaxException {
		authService.createAuthUsersList(autOid, authuser);

		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/auth/" + autOid + "/users"));

		return new ResponseEntity<Object>(HttpStatus.CREATED);
	}

	/** 권한 사용자 삭제 */
	@ApiOperation(value = "권한 사용자 삭제", notes = "<strong>권한 사용자을 삭제합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/auth/{autOid}/users")
	public ResponseEntity<Object> removeAuthUsers(@PathVariable(name = "autOid") String autOid) {
		authService.removeAuthUserList(autOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

	@ApiOperation(value = "권한 사용자 삭제", notes = "<strong>권한 사용자을 삭제합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/auth/{autOid}/users/{userOid}")
	public ResponseEntity<Object> removeAuthUsers(@PathVariable(name = "autOid") String autOid,
			@PathVariable(name = "userid") String userid) {
		authService.removeAuthUser(autOid, userid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

	/**************************************
	 * 권한 메뉴
	 **************************************/

	/** 권한 메뉴 조회 */
	@ApiOperation(value = "권한 메뉴 조회", notes = "<strong>권한 메뉴를 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/auth/{autOid}/menu")
	public ResponseEntity<List<Menu>> getAuthMenuList(@PathVariable(name = "autOid") String autOid, Menu menuVo) {
		List<Menu> listMenu = authService.getAuthMenuList(autOid, menuVo);
		return new ResponseEntity<List<Menu>>(listMenu, null, HttpStatus.OK);
	}

	/** 권한 메뉴 상세 조회 */
	@ApiOperation(value = "권한 메뉴 상세 조회", notes = "<strong>권한 메뉴 상세 페이지를 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/auth/{autOid}/menu/{menuOid}")
	public ResponseEntity<Object> getAuthMenu(@PathVariable(name = "autOid") String autOid,
			@PathVariable(name = "menuOid") String menuOid) {
		AuthMenu searchAuthMenu = new AuthMenu();
		searchAuthMenu.setAutOid(autOid);
		searchAuthMenu.setMenuOid(menuOid);

		Menu resultMenu = authService.getAuthMenu(searchAuthMenu);
		
		return new ResponseEntity<Object>(resultMenu, HttpStatus.OK);
	}

	/** 권한 메뉴(단건) 생성 */
	@ApiOperation(value = "권한 메뉴 단건 생성", notes = "<strong>권한 메뉴를 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공") })
	@PostMapping(value = "/auth/{autOid}/menu", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> createAuthMenu(@PathVariable(name = "autOid") String autOid, @RequestBody AuthMenu authMenuVo) throws URISyntaxException {
		String menuOid = authService.createMenuOid(autOid, authMenuVo);

		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/auth/" + autOid + "/menu/" + menuOid));
		
		if(menuOid != null) {
			return new ResponseEntity<Object>(HttpStatus.CREATED);
		}
		else {
			return new ResponseEntity<Object>(HttpStatus.CONFLICT);
		}
	}

	/** 권한 메뉴(멀티) Oid 생성 */
	@ApiOperation(value = "권한 메뉴 멀티 생성", notes = "<strong>권한 메뉴들을 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공") })
	@PostMapping(value = "/auth/{autOid}/menus", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> createAuthMenus(@PathVariable(name = "autOid") String autOid, @RequestBody List<AuthMenu> authMenuVo) throws URISyntaxException {
		authService.createAuthMenusList(autOid, authMenuVo);

		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/auth/" + autOid + "/menus"));

		return new ResponseEntity<Object>(responseHeaders, HttpStatus.CREATED);
	}

	@ApiOperation(value = "권한 메뉴 목록 삭제", notes = "<strong>권한 메뉴 목록을 삭제합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/auth/{autOid}/menu")
	public ResponseEntity<Object> removeAuthMenuList(@PathVariable(name = "autOid") String autOid) {
		authService.removeAuthMenuList(autOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

	@ApiOperation(value = "권한 메뉴 삭제", notes = "<strong>권한 메뉴를 삭제합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/auth/{autOid}/menu/{menuOid}")
	public ResponseEntity<Object> removeAuthMenu(@PathVariable(name = "autOid") String autOid,
			@PathVariable(name = "menuOid") String menuOid) {

		AuthMenu searchVo = new AuthMenu();
		searchVo.setSearchAuthOid(autOid);
		searchVo.setSearchMenuOid(menuOid);
		authService.removeAuthMenu(searchVo);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

	/**************************************
	 * 권한 API
	 **************************************/

	/** 권한 API 그룹 목록 조회 */
	@ApiOperation(value = "권한 API 그룹 목록 조회", notes = "<strong>권한 API 그룹 목록을 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/auth/{autOid}/apigroup")
	public ResponseEntity<Object> getAuthApigroupList(@PathVariable(name = "autOid") String autOid, Apigroup apiVo) {
		List<Apigroup> apigroupList = authService.getApigroupList(apiVo);
		return new ResponseEntity<Object>(apigroupList, null, HttpStatus.OK);
	}

	/** 권한 API 그룹 상세 조회 */
	@ApiOperation(value = "권한 API 그룹 상세 조회", notes = "<strong>권한 API 그룹 상세 페이지를 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/auth/{autOid}/apigroup/{grpOid}")
	public ResponseEntity<Object> getAuthApigroup(@PathVariable(name = "autOid") String autOid, @PathVariable(name = "grpOid") String grpOid) {
		AuthApi searchAuthApi = new AuthApi();
		searchAuthApi.setAutOid(autOid);
		searchAuthApi.setGrpOid(grpOid);
		
		Apigroup resultApigroup = authService.getApigroupDetail(searchAuthApi);

		return new ResponseEntity<Object>(resultApigroup, HttpStatus.OK);
	}

	/** 권한 API Oid 생성 */
	@ApiOperation(value = "권한 API 그룹 Oid 생성", notes = "<strong>권한 API 그룹 Oid를 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공"), @ApiResponse(code = 409, message = "ID 중복") })
	@PostMapping(value = "/auth/{autOid}/apigroup", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> createAuthApi(@PathVariable(name = "autOid") String autOid, @RequestBody Apigroup apiVo) throws URISyntaxException {		
		String grpOid = authService.createApiOid(autOid, apiVo);

		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/auth/" + autOid + "/apigroup/" + grpOid));
		
		if(grpOid != null) {
			return new ResponseEntity<Object>(HttpStatus.CREATED);
		}
		else {
			return new ResponseEntity<Object>(HttpStatus.CONFLICT);
		}
	}

	/** 권한 API(멀티) Oid 생성 */
	@ApiOperation(value = "권한 API 그룹 Oid 멀티 생성", notes = "<strong>권한 API 그룹 Oid List를 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공"), @ApiResponse(code = 409, message = "ID 중복") })
	@PostMapping(value = "/auth/{autOid}/apigroups", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> createAuthApis(@PathVariable(name = "autOid") String autOid, @RequestBody List<Apigroup> apiVo) throws URISyntaxException {
		authService.createApiOidList(autOid, apiVo);
		
		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/auth/" + autOid + "/apigroups"));

		return new ResponseEntity<Object>(HttpStatus.CREATED);
	}

	/** 권한 API 그룹 전체 삭제 */
	@ApiOperation(value = "권한 API 그룹 전체 삭제", notes = "<strong>권한 API 그룹을 전체 삭제합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/auth/{autOid}/apigroup")
	public ResponseEntity<Object> removeAuthApigroups(@PathVariable(name = "autOid") String autOid) {
		authService.removeAuthApigroupList(autOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

	/** 권한 API 그룹 삭제 */
	@ApiOperation(value = "권한 API 그룹 삭제", notes = "<strong>권한 API 그룹을 삭제합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/auth/{autOid}/apigroup/{grpOid}")
	public ResponseEntity<Object> removeAuthApigroup(@PathVariable(name = "autOid") String autOid, @PathVariable(name = "grpOid") String grpOid) {
		authService.removeAuthApigroup(grpOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

}
