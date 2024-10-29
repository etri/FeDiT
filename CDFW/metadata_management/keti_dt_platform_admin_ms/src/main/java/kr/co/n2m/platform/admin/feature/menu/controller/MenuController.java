package kr.co.n2m.platform.admin.feature.menu.controller;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
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
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import kr.co.n2m.platform.admin.feature.menu.entity.Menu;
import kr.co.n2m.platform.admin.feature.menu.service.MenuService;
import kr.co.n2m.platform.common.entity.CamelCaseMap;
import kr.co.n2m.platform.common.property.AuthorizationProperty;

@RestController
@Api(tags = "메뉴")
@ApiResponses({ @ApiResponse(code = 404, message = "페이지를 찾을 수 없습니다."),
		@ApiResponse(code = 500, message = "내부 서버 오류가 발생하였습니다.") })
public class MenuController {
	
	@Autowired
	private AuthorizationProperty authProperty;

	@Autowired
	private MenuService menuService;

	/** 사용자 권한에 매핑된 메뉴 목록 조회 */
	@ApiOperation(value = "사용자 권한에 매칭된 메뉴 목록 조회", notes = "<strong>사용자에 매핑된 메뉴 목록을 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "조회 성공") })
	@ApiImplicitParams({@ApiImplicitParam(name= "pltfrmId", value= "플랫폼 ID"),
		@ApiImplicitParam(name= "searchType", value= "검색 조건"),
		@ApiImplicitParam(name= "admrYn", value= "관리자 여부"),
		@ApiImplicitParam(name= "typeCd", value= "유형 코드"),
		@ApiImplicitParam(name= "userId", value= "사용자 ID"),
	})
	
	@GetMapping(value = "/usermenu")
	public ResponseEntity<List<CamelCaseMap>> getUserMenuList(
			@RequestParam(value = "userId", required = false) String userId, 
			@RequestParam(value = "searchType", required = false) String searchType, 
			@RequestParam(value = "pltfrmId", required = false) String pltfrmId, 
			@RequestParam(value = "admrYn", required = false) String admrYn, 
			@RequestParam(value = "typeCd", required = false) String typeCd,
			@RequestParam(value = "readYn", required = false) String readYn) {
		
		List<String> defaultAutOidList = new ArrayList<>();
		if (Boolean.parseBoolean(authProperty.getDefaultAuthUseFlag())) {
			authProperty.getDefaultAuthList().forEach(str -> defaultAutOidList.add(str)); // 기본 권한
		}
		
		List<CamelCaseMap> resultList = menuService.getUserMenu(userId, searchType, pltfrmId, admrYn, typeCd,readYn, defaultAutOidList);
		return new ResponseEntity<List<CamelCaseMap>>(resultList, HttpStatus.OK);
	}

	/** 메뉴 전체 목록 조회 */
	@GetMapping(value = "/menu")
	@ApiOperation(value = "메뉴 전체 목록 조회", notes = "<strong>메뉴 전체 목록을 조회합니다.</strong>", response = Menu.class)
	@ApiResponses({ @ApiResponse(code = 200, message = "조회 성공") })
	public ResponseEntity<List<Menu>> getMenuList(Menu menuVo) {
		List<Menu> menuList = menuService.getMenuList(menuVo);
		return new ResponseEntity<List<Menu>>(menuList, null, HttpStatus.OK);
	}

	/** 메뉴 조회 */
	@GetMapping(value = "/menu/{menuOid}")
	@ApiOperation(value = "메뉴 목록 조회", notes = "<strong>메뉴 목록을 조회합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 200, message = "조회 성공") })
	@ApiImplicitParam(name = "menuOid", value="메뉴 OID" ,required = true)
	public ResponseEntity<Object> getMenu(@PathVariable(name = "menuOid") String menuOid) {
		Menu result = menuService.getMenu(menuOid);
		return new ResponseEntity<Object>(result, null, HttpStatus.OK);
	}

	/** 메뉴 생성 */
	@ApiOperation(value = "메뉴 생성", notes = "<strong>메뉴를 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공") })
	@PostMapping(value = "/menu", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Menu> createMenu(@RequestBody Menu menuVo) throws URISyntaxException {
		String menuoid = menuService.createMenu(menuVo);

		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/menu/" + menuoid));

		return new ResponseEntity<Menu>(responseHeaders, HttpStatus.CREATED);
	}

	/** 메뉴 수정 */
	@ApiOperation(value = "메뉴 수정", notes = "<strong>메뉴를 수정합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공") })
	@PutMapping(value = "/menu/{menuOid}", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> modifyMenu(@RequestBody Menu menuVo) throws URISyntaxException {
		String menuoid = menuService.modifyMenu(menuVo);

		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/menu/" + menuoid));
		
		menuService.modifyMenu(menuVo);
		return new ResponseEntity<Object>(HttpStatus.OK);
	}

	/** 메뉴 삭제 */
	@DeleteMapping(value = "/menu/{menuOid}")
	@ApiOperation(value = "메뉴 삭제", notes = "<strong>메뉴를 삭제합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 204, message = "삭제 성공") })
	@ApiImplicitParams({@ApiImplicitParam(name = "params", required = false),
		@ApiImplicitParam(name = "menuOid", value="메뉴 OID" ,required = true),
	})
	public ResponseEntity<Object> removeMenu(@PathVariable(name = "menuOid") String menuOid) {
		menuService.removeMenu(menuOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	/** 메뉴 네이게이션 목록 조회 */
	@GetMapping(value = "/getBreadCrumb/{menuOid}")
	@ApiOperation(value = "메뉴 네이게이션 목록 조회", notes = "<strong>메뉴 네이게이션 목록을 조회합니다.</strong>", response = Menu.class)
	@ApiResponses({ @ApiResponse(code = 200, message = "조회 성공") })
	@ApiImplicitParams({
		@ApiImplicitParam(name= "userId", value= "user Id"),
		@ApiImplicitParam(name= "menuOid", value= "메뉴 OID"),
		@ApiImplicitParam(name= "typeCd", value= "유형 코드")})
	public ResponseEntity<Map<String, Object>> getBreadCrumb(
			@RequestParam(value = "userId", required = false) String userId, 
			@RequestParam(value = "menuOid", required = false) String menuOid, 
			@RequestParam(value = "typeCd", required = false) String typeCd) {
		Map<String, Object> breadCrumbMenu = menuService.getBreadCrumbMenu(userId, menuOid ,typeCd);
		return new ResponseEntity<Map<String, Object>>(breadCrumbMenu, null, HttpStatus.OK);
	}
}
