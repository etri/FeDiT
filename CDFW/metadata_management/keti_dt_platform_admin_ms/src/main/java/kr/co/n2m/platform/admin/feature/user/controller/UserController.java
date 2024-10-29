package kr.co.n2m.platform.admin.feature.user.controller;

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
import kr.co.n2m.platform.admin.feature.menu.entity.Menu;
import kr.co.n2m.platform.admin.feature.user.entity.User;
import kr.co.n2m.platform.admin.feature.user.service.UserService;

@RestController
@Api(tags = "사용자 관리")
@ApiResponses(value = { @ApiResponse(code = 404, message = "Not Found"),
		@ApiResponse(code = 500, message = "Internal Server Errpor") })
public class UserController {

	@Autowired
	private UserService userService;

	/** 사용자 목록 조회 */
	@ApiOperation(value = "사용자 목록 조회 (페이징 처리)", notes = "<strong>사용자 목록을 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/userPaging")
	public ResponseEntity<Map<String, Object>> getUserListByPaging(User userEntity) {
		Map<String, Object> listResult = userService.getUserListByPaging(userEntity);
		return new ResponseEntity<Map<String, Object>>(listResult, HttpStatus.OK);
	}

	/** 사용자 목록 조회 */
	@ApiOperation(value = "사용자 목록 조회", notes = "<strong>사용자 목록을 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/user")
	public ResponseEntity<List<User>> getUserList(User userEntity) {
		List<User> listUser = userService.getUserList(userEntity);
		return new ResponseEntity<List<User>>(listUser, HttpStatus.OK);
	}

	/** 사용자 목록 상세 조회 */
	@ApiOperation(value = "사용자 목록 상세 조회", notes = "<strong>사용자 목록 상세 페이지를 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/user/{userOid}")
	public ResponseEntity<User> getUser(@PathVariable(name = "userOid", required = true) String userOid) {
		User result = userService.getUser(userOid);
		return new ResponseEntity<User>(result, HttpStatus.OK);
	}

	/** 사용자 생성 */
	@ApiOperation(value = "사용자 생성", notes = "<strong>사용자를 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공"), @ApiResponse(code = 409, message = "ID 중복") })
	@PostMapping(value = "/user", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<User> createUser(@RequestBody User userVo) throws URISyntaxException {
		HttpHeaders responseHeaders = new HttpHeaders();
		HttpStatus httpStatusCode = null;

		String userOid = userService.createUser(userVo);
		if (userOid == null) {
			httpStatusCode = HttpStatus.CONFLICT;
		} else {
			httpStatusCode = HttpStatus.CREATED;
			responseHeaders.setLocation(new URI("/user/" + userOid));
		}

		return new ResponseEntity<User>(responseHeaders, httpStatusCode);
	}

	/** 사용자 수정 */
	@ApiOperation(value = "사용자 수정", notes = "<strong>사용자 정보를 수정합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "OK"), @ApiResponse(code = 409, message = "ID 중복") })
	@PutMapping(value = "/user/{userOid}", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<User> modifyUser(@PathVariable(name = "userOid") String userOid, @RequestBody User userVo) {
		HttpStatus httpStatusCode = null;

		userVo.setUserOid(userOid);
		String resultUserOid = userService.modifyUser(userVo);
		if (resultUserOid == null) {
			httpStatusCode = HttpStatus.CONFLICT;
		} else {
			httpStatusCode = HttpStatus.NO_CONTENT;
		}
		return new ResponseEntity<User>(httpStatusCode);
	}

	/** 사용자 삭제 */
	@ApiOperation(value = "사용자 삭제", notes = "<strong>사용자 정보를 삭제합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/user/{userOid}")
	public ResponseEntity<User> removeUser(@PathVariable(name = "userOid") String userOid) {
		userService.removeUser(userOid);
		return new ResponseEntity<User>(HttpStatus.NO_CONTENT);
	}

}
