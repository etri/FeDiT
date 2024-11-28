package net.jcms.framework.security.web;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.security.model.LoginLog;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserSearch;
import net.jcms.framework.security.service.LoginLogService;
import net.jcms.framework.security.service.UserService;
import net.jcms.framework.util.StrUtil;
import net.jw.twin.repository.annotation.HandleRuntimeException;
import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import net.jw.twin.repository.global.CodeValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.*;

@Controller
@Slf4j
public class UserController extends BaseController {

	@Resource (name="userService")
	private UserService userService;

	@Resource (name="loginLogService")
	private LoginLogService loginLogService;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@RequestMapping ("/system/register.do")
	public String register (HttpServletRequest request, Model model) {
		model.addAttribute("path", request.getParameter("path"));
		return "system/register";
	}

	@RequestMapping ("/system/findPassword.do")
	public String findPassword (HttpServletRequest request, Model model) {
		model.addAttribute("path", request.getParameter("path"));
		return "system/findPw";
	}

	@RequestMapping ("/system/login/findPassword.json")
	@ResponseBody
	public Map<String, Object> findPassword (UserSearch userSearch) {

		Map<String, Object> result = new HashMap<String, Object>();

		userService.findPw(userSearch);

		result.put("result", "success");

		return result;
	}

	// 로그인, 로그아웃
	@RequestMapping (value="/login/loginForm.mng")
	public String loginForm (HttpServletRequest request, Model model) {
		model.addAttribute("path", request.getParameter("path"));
		return "system/login";
//		return "cim/login";
	}
	
	@RequestMapping (value="/login/login.mng", method=RequestMethod.POST)
	public String systemLogin (HttpServletRequest request) {
		String path = request.getParameter("path");
		if(!path.equals("") && !path.equals("null") && path != null){
			return "redirect:"+request.getParameter("path");
		}
		// TODO_bocos
//		return "redirect:"+ FrontGlobal.getMainPageUrl() +"?path="+request.getParameter("path");
		return "redirect:"+ "/system/index.mng" +"?path="+request.getParameter("path");
	}
	
//	@RequestMapping(value="/logout.mng")
//	public String logoutPage (HttpServletRequest request, HttpServletResponse response) {
//	    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
//	    if (auth != null){
//	    	HttpSession session = request.getSession();
//	    	LoginLog loginLog = new LoginLog();
//	    	loginLog.setLoginLogId((Long) session.getAttribute("loginLogId"));
//	        loginLogService.update(loginLog);
//	        new SecurityContextLogoutHandler().logout(request, response, auth);
//	    }
//	    return "redirect:/login/loginForm.mng?path="+request.getParameter("path");
//	}

	// 회원가입
	@RequestMapping("/login/join.mng")
	public String joinPage() {
		return "system/join";
	}

	@RequestMapping (value="/login/user/join.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, String> join (User user) {
		return userService.joinTransactional(user);
	}

	// 회원가입 : 아이디 중복 확인
	// 사용자관리(회원관리) : 사용자 등록시 아이디 중복 확인
	@RequestMapping (value={ "/login/duplicate.json","/system/user/duplicate.json" }, method=RequestMethod.POST)
	@ResponseBody
	public Map<String, String> idDuplicate (UserSearch userSearch) {
		Map<String, String> result = new HashMap <String, String> ();
		if (userService.checkIdDuplicate(userSearch) > 0) {
			result.put("result", "exist");
			result.put("message", "이미 사용중인 아이디입니다. 다른 아이디를 입력해주세요.");
		} else {
			result.put("result", "nonExist");
			result.put("message", "사용가능한 아이디입니다.");
		}
		return result;
	}

	// 마이페이지
	@RequestMapping (value="/system/mypage/list.mng", method=RequestMethod.GET)
	public String mypage(HttpServletRequest request,Model model,UserSearch userSearch) {
		HttpSession session = request.getSession();
		User user = (User) session.getAttribute("user");
		userSearch.setUserId(user.getUserId());
		model.addAttribute("Selectuser", userService.select(userSearch));
		return "system/user/mypage";
	}

	// 마이페이지 : 사용자 정보 수정
	@RequestMapping (value="/system/mypage/update.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> update(User user){
		return userService.updateTransactional(user);
	}

	// 마이페이지 : 사용자 비밀번호 확인
	@RequestMapping (value = "/system/mypage/pwdCheck.json", method = RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> pwdCheck(HttpServletRequest request) {
		Map<String, Object> result = new HashMap<String, Object>();
		UserSearch userSearch = new UserSearch();
		userSearch.setUserId(Long.parseLong(request.getParameter("userId")));
		User user = userService.select(userSearch);
//		if(!user.getUserPwd().equals(StrUtil.encryptSha512(request.getParameter("userPwd"), user.getUserLoginId()))){
		if(passwordEncoder.matches(user.getUserPwd(), request.getParameter("userPwd"))) {
			result.put("result", "notEqual");
		} else {
			result.put("result", "success");
		}
		return result;
	}

	// 마이페이지 : 회원 탈퇴
	@RequestMapping (value = "/system/mypage/userOut.json", method = RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> userOut(User user) {
		return userService.userOutTransactional(user);
	}

	// 마이페이지 : 비밀번호 변경
	@RequestMapping (value="/system/mypage/pwdUpdate.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> pwdUpdate(User user) {
		return userService.pwdUpdateTransactional(user);
	}

	// 사용자관리(회원관리)
	@RequestMapping (value="/system/user/list.mng", method=RequestMethod.GET)
	public String list() {
		return "system/user/list";
	}

	@PostMapping("/system/user/list.json")
	@ResponseBody
	@HandleRuntimeException(ErrorStatus.E_COMMON__USER)
	public ResponseEntity<?> getList(HttpServletRequest request, UserSearch userSearch) {
		Map<String, Object> result = new HashMap<String, Object>();
		String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
		String sortOder = request.getParameter("order[0][dir]");
		userSearch.setSort(sort);
		userSearch.setSortOrd(sortOder);
		userSearch.setPagingYn(true);

		int totalCount = userService.count(userSearch);
		result.put("recordsTotal", totalCount);
		result.put("recordsFiltered", totalCount);
		result.put("data", userService.selectList(userSearch));

		return ResponseEntity.ok(result);
	}

	@PostMapping("/system/user/list-with-role.json")
	@ResponseBody
	@HandleRuntimeException(ErrorStatus.E_COMMON__USER)
	public ResponseEntity<?> getListWithRole(HttpServletRequest request, UserSearch userSearch) {
		Map<String, Object> result = new HashMap<String, Object>();
		String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
		String sortOder = request.getParameter("order[0][dir]");
		userSearch.setSort(sort);
		userSearch.setSortOrd(sortOder);
		userSearch.setPagingYn(true);

		int totalCount = userService.countWithRole(userSearch);
		result.put("recordsTotal", totalCount);
		result.put("recordsFiltered", totalCount);
		result.put("data", userService.selectWithRole(userSearch));

		return ResponseEntity.ok(result);
	}


	@PostMapping("/system/user/list-belong-institution.json")
	@ResponseBody
	@HandleRuntimeException(ErrorStatus.E_COMMON__USER)
	public ResponseEntity<?> listWithRole(HttpServletRequest request, UserSearch userSearch) {
		HttpSession hs = request.getSession();
		User user = (User)hs.getAttribute("user");
		System.out.println(user);

		Map<String, Object> result = new HashMap<String, Object>();
		String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
		String sortOder = request.getParameter("order[0][dir]");
		userSearch.setSort(sort);
		userSearch.setSortOrd(sortOder);
		userSearch.setPagingYn(true);
		userSearch.setInstitutionId(user.getInstitutionId());

		List<String> ruleAuthList = userSearch.getRoleAuthList();
		ruleAuthList.add(CodeValue.ROLE_AUTH.ROLE_MEMBER_ADMIN.name());
		ruleAuthList.add(CodeValue.ROLE_AUTH.ROLE_MEMBER.name());
		ruleAuthList.add(CodeValue.ROLE_AUTH.ROLE_USER.name());

		System.out.println(CodeValue.ROLE_AUTH.ROLE_USER.name());

		int totalCount = userService.countWithRole(userSearch);
		result.put("recordsTotal", totalCount);
		result.put("recordsFiltered", totalCount);

		List<User> userList = userService.selectWithRole(userSearch);
		userList.removeIf(e -> e.getUserId().equals(user.getUserId()));
		result.put("data", userList);

		return ResponseEntity.ok(result);
	}

	// 사용자관리(회원관리) : 사용자 정보 등록
	@RequestMapping (value="/system/user/insert.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> userInsert(User user) {
		return userService.insertRoleUserTransactional(user);
	}

	// 사용자관리(회원관리) : 사용자 정보 수정
	@RequestMapping (value = "/system/user/update.json", method = RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> userUpdate(User user) {
		return userService.userUpdateTransactional(user);
	}

	// 사용자관리(회원관리) : 사용자 정보 삭제
	@RequestMapping (value="/system/user/delete.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, String> userDelete (User user) {
		return userService.userDeleteTransactional(user);
	}

	// 사용자관리(회원관리) : 로그인 실패 카운터 초기화
	@RequestMapping (value="/system/user/initFailCnt.json", method=RequestMethod.POST) 
	@ResponseBody
	public Map<String, String> initFailCntUpdate (User user) {
		return userService.initFailCntUpdateTransactional(user);
	}

	// 사용자관리(회원관리) : 사용자 정보 상세보기
	@RequestMapping (value="/system/user/detailUser.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> userDetail(UserSearch userSearch){
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("data", userService.select(userSearch));
		result.put("result", "success");

		return result;
	}
	
	@GetMapping(value="/system/user/detail/{id}.json")
	@ResponseBody
	@HandleRuntimeException(ErrorStatus.E_COMMON__USER)
	public ResponseEntity<?> detail(@PathVariable Long id) throws IOException {

		UserSearch search = UserSearch.builder()
							.userId(id)
							.build();

		return ResponseEntity.ok(userService.select(search));
	}

	@GetMapping("/system/user/detail/current.json")
	@ResponseBody
	@HandleRuntimeException(ErrorStatus.E_COMMON__USER)
	public ResponseEntity<?> getCurrentDetail() {
		Long userId = Optional.ofNullable(getUserId()).orElseThrow(()->new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "유저정보 획득 실패."));

		UserSearch search = UserSearch.builder()
				.userId(userId)
				.build();

		return ResponseEntity.ok(userService.select(search));
	}

	@Transactional
	@PatchMapping("/system/user/update-patch.json")
	@ResponseBody
	@HandleRuntimeException(ErrorStatus.E_COMMON__USER)
	public ResponseEntity<?> updatePatch(@RequestBody User user){
		int count = userService.update(user);
		if(count != 1){
			throw new CustomException(ErrorStatus.E_DB__FAIL_MODIFY, "user id : " + user.getUserId());
		}

		return new ResponseEntity<>(HttpStatus.OK);
	}
}
