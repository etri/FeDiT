package net.jcms.framework.security.service.impl;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.security.mapper.UserMapper;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserRole;
import net.jcms.framework.security.model.UserSearch;
import net.jcms.framework.security.service.UserRoleService;
import net.jcms.framework.security.service.UserService;
import net.jcms.framework.util.StrUtil;
import net.jw.twin.repository.db.restKey.model.RestKey;
import net.jw.twin.repository.db.restKey.model.RestKeySearch;
import net.jw.twin.repository.db.restKey.service.RestKeyService;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import net.jw.twin.repository.global.CodeValue;
import net.jw.twin.repository.util.ShaUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service(value="userService")
@Slf4j
public class UserServiceImpl extends BaseServiceAbst<User, UserSearch, UserMapper> implements UserService {

	@Resource (name = "userRoleService")
	private UserRoleService userRoleService;

	@Autowired
	JavaMailSender emailSender;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private RestKeyService restKeyService;

	@Autowired
	private ShaUtil shaUtil;

	@Override
	@Resource (name="userMapper")
	protected void setMapper (UserMapper mapper) {
		super.setMapper (mapper);
	}



	@Transactional(rollbackFor = {Exception.class})
	@Override
	public Long getAutoIncNumber() {
		return mapper.getAutoIncNumber();
	}

	@Override
	public void join(User user) {
		user.setUserPwd(passwordEncoder.encode(user.getUserPwd()));
		super.insert(user);

		// 회원가입시 디폴트로 일반사용자 권한 부여
		UserRole userRole = new UserRole();
		userRole.setUserId(user.getUserId());
		userRole.setRoleAuth("ROLE_USER");
		userRoleService.insert(userRole);
	}

	@Override
	public void findPw(UserSearch userSearch) {
		
		User user = super.select(userSearch);
		if( null == user ){
			// TODO_bocos
//			throw new CustomException(ErrorCode.DB_DATA_NOT_FOUND, "DB에 유저 정보가 없습니다. userLoginId : " + userSearch.getUserLoginId());
			throw new RuntimeException("DB에 유저 정보가 없습니다. userLoginId : " + userSearch.getUserLoginId());
		}

		if( null == user.getEmail() || user.getEmail().isEmpty() ){
			// TODO_bocos
//			throw new CustomException(ErrorCodeEx.USER_HAS_NO_EMAIL, "해당 유저에 email 정보가 없습니다. userLoginId : " + userSearch.getUserLoginId());
			throw new RuntimeException("해당 유저에 email 정보가 없습니다. userLoginId : " + userSearch.getUserLoginId());
		}

		String pwd = StrUtil.tempPwd(10);
		
		user.setUserPwd(pwd);
		updatePwd(user);
	
		try{
			String title = "임시비밀번호";

			SimpleMailMessage message = new SimpleMailMessage();
			message.setFrom("soo1206@gmail.com");
			message.setTo(user.getEmail());
			message.setSubject(title);
			message.setText("임시비밀번호 : " + pwd);
			emailSender.send(message);

		}catch (MailException e){
			// TODO_bocos
//			throw new CustomException(ErrorCodeEx.FAILED_TO_SEND_MAIL, "EMail 전송 실패. userLoginId : " + userSearch.getUserLoginId());
			throw new RuntimeException("EMail 전송 실패. userLoginId : " + userSearch.getUserLoginId());
		}
	}
	
	
	@Override
	public int checkIdDuplicate(UserSearch userSearch) {
		return mapper.checkIdDuplicate(userSearch);
	}

	@Override
	public void updateUserLoginFail(User user) {
		mapper.updateUserLoginFail(user);
	}

	@Override
	public void updateInitUserLoginFailCnt(User user) {
		mapper.updateInitUserLoginFailCnt(user);
	}

	@Override
	public int userPwdCheck(UserSearch userSearch) {
		return mapper.userPwdCheck(userSearch);
	}

	@Override
	public int insert(User user) {
		user.setUserPwd(passwordEncoder.encode(user.getUserPwd()));
		return super.insert(user);
	}

	@Override
	public void updatePwd(User user) {
		user.setUserPwd(passwordEncoder.encode(user.getUserPwd()));
		mapper.updatePwd(user);
	}
	
	@Override
	public int userTotalOutCount() {
		return mapper.userTotalOutCount();
	}
	
	@Override
	public int thisWeekInUserCount() {
		return mapper.thisWeekInUserCount();
	}
	
	@Override
	public int thisWeekOutUser() {
		return mapper.thisWeekOutUser();
	}
	
	@Override
	public List<User> thisWeekInUser() {
		return mapper.thisWeekInUser();
	}

	private String createRestKey(User user) {
		ZoneId zoneSeoul = ZoneId.of("Asia/Seoul");
		Instant instant = LocalDateTime.now().atZone(zoneSeoul).toInstant();
		return shaUtil.createHash(Long.toHexString(instant.toEpochMilli())+user.getUserLoginId());
	}

	@Transactional(rollbackFor = {Exception.class})
	public Map<String, Object> insertRoleUserTransactional(User user){
		String token = null;
		try {
			token = createRestKey(user);
		}catch (Exception e){
			throw new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "failed to get token.");
		}

		Map<String, Object> result = new HashMap<String, Object>();

		Long autoInc = getAutoIncNumber();
		user.setUserId(autoInc);
		insert(user);

		UserRole role = new UserRole();
		role.setUserId(user.getUserId());
		role.setRoleAuth("ROLE_USER");
		userRoleService.insert(role);

		RestKey restKey = RestKey.builder()
				.userId(user.getUserId())
				.token(token)
				.issueTime(LocalDateTime.now())
				.status(CodeValue.RestKeyStatus.issued.getName())
				.build();

		restKeyService.insert(restKey);

		result.put("result", "success");

		return result;
	}

	@Transactional(rollbackFor = {Exception.class})
	public Map<String, String> joinTransactional(User user){
		Map<String, String> result = new HashMap<String, String>();

		user.setRegId(getUserId());
		join(user);
		result.put("result", "success");

		return result;
	}

	@Transactional(rollbackFor = {Exception.class})
	public Map<String, Object> updateTransactional(User user){
		Map<String, Object> result = new HashMap<String, Object>();

		user.setUpdId(getUserId());
		update(user);

		result.put("result", "success");

		return result;
	}

	@Transactional(rollbackFor = {Exception.class})
	public Map<String, Object> userOutTransactional(User user){
		Map<String, Object> result = new HashMap<String, Object>();

		user.setUserSt("9");
		user.setUpdId(getUserId());
		update(user);

		result.put("result", "success");

		return result;
	}

	@Transactional(rollbackFor = {Exception.class})
	public Map<String, Object> pwdUpdateTransactional(User user){
		Map<String, Object> result = new HashMap<String, Object>();

		user.setUpdId(getUserId());

		updatePwd(user);

		result.put("result", "success");

		return result;
	}

	@Transactional(rollbackFor = {Exception.class})
	public Map<String, Object> userInsertTransactional(User user){
		Map<String, Object> result = new HashMap<String, Object>();

		Long autoInc = getAutoIncNumber();
		user.setUserId(autoInc);
		user.setRegId(getUserId());
		insert(user);

		result.put("result", "success");

		return result;
	}

	@Transactional(rollbackFor = {Exception.class})
	public Map<String, Object> userUpdateTransactional(User user){
		Map<String, Object> result = new HashMap<String, Object>();

		user.setUpdId(getUserId());

		update(user);

		result.put("result", "success");

		return result;
	}

	@Transactional(rollbackFor = {Exception.class})
	public Map<String, String> userDeleteTransactional(User user){
		Map<String, String> result = new HashMap<String, String>();

		user.setDelId(getUserId());
		delete(user);
		result.put("result", "success");

		return result;
	}

	@Transactional(rollbackFor = {Exception.class})
	public Map<String, String> initFailCntUpdateTransactional(User user){
		Map<String, String> result = new HashMap<String, String>();

		updateInitUserLoginFailCnt(user);
		result.put("result", "success");

		return result;
	}

	@Transactional(rollbackFor = {Exception.class})
	public void reissueRestKeyTransactional(User user) {
		RestKeySearch search = RestKeySearch.builder()
				.userId(user.getUserId())
				.status(CodeValue.RestKeyStatus.issued.getName())
				.build();

		RestKey restKey = null;

		try {
			restKey = Optional.ofNullable(restKeyService.select(search)).orElseThrow(() -> new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "select restkey is null. userId = " + user.getUserId()));
		} catch (Exception e) {
			throw new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "failed to select restkey. userId = " + user.getUserId());
		}

		restKey.setStatus(CodeValue.RestKeyStatus.expired.getName());
		restKey.setExpireTime(LocalDateTime.now());

		restKeyService.update(restKey);

		String token = null;
		try {
			token = createRestKey(user);
		}catch (Exception e){
			throw new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "failed to get token.");
		}

		restKey = RestKey.builder()
				.userId(user.getUserId())
				.token(token)
				.issueTime(LocalDateTime.now())
				.status(CodeValue.RestKeyStatus.issued.getName())
				.build();

		restKeyService.insert(restKey);
	}

	public int countWithRole(UserSearch userSearch){
		return mapper.countWithRole(userSearch);
	}

	@Transactional(rollbackFor = {Exception.class})
	public List<User> selectWithRole(UserSearch userSearch){
		return mapper.selectWithRole(userSearch);
	}
}
