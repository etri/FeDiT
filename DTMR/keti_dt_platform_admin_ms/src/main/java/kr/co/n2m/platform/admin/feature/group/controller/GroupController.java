package kr.co.n2m.platform.admin.feature.group.controller;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import kr.co.n2m.platform.admin.feature.group.entity.Group;
import kr.co.n2m.platform.admin.feature.group.entity.GroupUser;
import kr.co.n2m.platform.admin.feature.group.service.GroupService;

@RestController
@Api(tags = "그룹 관리")
@ApiResponses(value = { @ApiResponse(code = 404, message = "Not Found"),
		@ApiResponse(code = 500, message = "Internal Server Error") })
public class GroupController {

	@Autowired
	private GroupService groupService;

	
	/** 그룹 목록 페이징 조회 */
	@ApiOperation(value = "그룹 목록 조회(페이징 처리)", notes = "<strong>그룹 목록을 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/groupPaging")
	public ResponseEntity<Map<String, Object>> getGroupListByPaging(Group searchVo) {
		Map<String, Object> list = groupService.getGroupListByPaging(searchVo);
		return new ResponseEntity<Map<String, Object>>(list, HttpStatus.OK);
	}

	/** 그룹 목록 조회 */
	@ApiOperation(value = "그룹 목록 조회", notes = "<strong>그룹 목록을 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/group")
	public ResponseEntity<List<Group>> getGroupList(Group searchVo) {
		List<Group> list = groupService.getGroupList(searchVo);
		return new ResponseEntity<List<Group>>(list, HttpStatus.OK);
	}

	/** 그룹 상세 조회 */
	@ApiOperation(value = "그룹 상세 조회", notes = "<strong>그룹 목록을 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/group/{grpId}")
	public ResponseEntity<Group> getGroupDetail(@PathVariable(name = "grpId", required = true) String grpId) {
		Group group = groupService.getGroupDetail(grpId);
		return new ResponseEntity<Group>(group, HttpStatus.OK);
	}

	/** 그룹 생성 */
	@ApiOperation(value = "그룹 생성", notes = "<strong>그룹을 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공") })
	@PostMapping(value = "/group", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> createGroup(@RequestBody Group groupVo) throws URISyntaxException {
		String grpId = groupService.createGroup(groupVo);

		if(grpId != null) {
			HttpHeaders responseHeaders = new HttpHeaders();
			responseHeaders.setLocation(new URI("/group/" + grpId));

			return new ResponseEntity<Object>(grpId,HttpStatus.CREATED);
		}else {
			return new ResponseEntity<Object>(HttpStatus.CONFLICT);
		}
	}

	/** 그룹 수정 */
	@ApiOperation(value = "그룹 수정", notes = "<strong>그룹을 수정합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@PutMapping(value = "/group/{grpId}", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> modifyGroup(@RequestBody Group groupVo) throws URISyntaxException {
		String grpId = groupService.modifyGroup(groupVo);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/group/" + grpId));
		
		if(groupVo.getGrpId().equals(grpId)) {
			return new ResponseEntity<Object>(HttpStatus.OK);
		}else {
			return new ResponseEntity<Object>(HttpStatus.CONFLICT);
		}
	}

	/** 그룹 삭제 */
	@ApiOperation(value = "그룹 삭제", notes = "<strong>그룹을 삭제합니다.</strong>", response = Group.class)
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/group/{grpId}")
	public ResponseEntity<Object> removeGroup(@PathVariable(name = "grpId") String grpId) {
		groupService.removeGroup(grpId);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}


	/************************************** 그룹 사용자 **************************************/

	
	/** 그룹 사용자 조회 */
	@ApiOperation(value = "그룹 사용자 조회", notes = "<strong>그룹 사용자를 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/groupUsers")
	public ResponseEntity<Object> getGroupUserList(GroupUser user) {
		List<GroupUser> list = groupService.getGroupUserList(user);
		return new ResponseEntity<Object>(list, HttpStatus.OK);
	}

	/** 그룹 사용자 상세 조회 */
	@ApiOperation(value = "그룹 사용자 상세 조회", notes = "<strong>그룹 사용자를 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "OK") })
	@GetMapping(value = "/groupUsers/{userid}")
	public ResponseEntity<Object> getGroupUserDetail(@PathVariable(name = "grpId") String grpId, @PathVariable(name = "userId") String userId) {
		GroupUser userVo = groupService.getGroupUserDetail(grpId, userId);
		return new ResponseEntity<Object>(userVo, null, HttpStatus.OK);
	}

//	/** 그룹 사용자 생성 */
//	@ApiOperation(value = "그룹 사용자 생성", notes = "<strong>그룹 사용자를 생성합니다.</strong>")
//	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공") })
//	@PostMapping(value = "/groupUser", consumes = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> createGroupUser(@RequestBody GroupUser userVo) throws URISyntaxException {
//		String userId = groupService.createGroupUser(userVo);
//
//		HttpHeaders responseHeaders = new HttpHeaders();
//		responseHeaders.setLocation(new URI("/groupUser/" + userId));
//		
//		if(userId != null) {
//			return new ResponseEntity<Object>(HttpStatus.CREATED);
//		}
//		else {
//			return new ResponseEntity<Object>(HttpStatus.CONFLICT);
//		}
//	}
//
//	/** 그룹 사용자(멀티) 생성 */
//	@ApiOperation(value = "그룹 사용자 멀티 생성", notes = "<strong>그룹 사용자들을 생성합니다.</strong>")
//	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공") })
//	@PostMapping(value = "/groupUsers", consumes = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> createGroupUsersList(@RequestBody List<GroupUser> groupuser) {
//		groupService.createGroupUsersList(groupuser);
//		return new ResponseEntity<Object>(HttpStatus.CREATED);
//	}

	/** 그룹 사용자 전체 삭제 */
	@ApiOperation(value = "그룹 사용자 전체 삭제", notes = "<strong>그룹 사용자를 전체 삭제합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/groupUsers")
	public ResponseEntity<Object> removeGroupUserList(@RequestParam String grpId) {
		groupService.removeGroupUserList(grpId);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

	/** 그룹 사용자 삭제 */
	@ApiOperation(value = "그룹 사용자 삭제", notes = "<strong>그룹 사용자을 삭제합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@DeleteMapping(value = "/groupUsers/{userId}")
	public ResponseEntity<Object> removeGroupUser(@RequestParam String grpId,
			@PathVariable(name = "userid") String userid) {
		groupService.removeGroupUser(grpId, userid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

}
