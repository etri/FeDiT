package net.jcms.framework.security.service;

import net.jcms.framework.base.service.BaseService;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserSearch;

import java.util.List;
import java.util.Map;

public interface UserService extends BaseService<User, UserSearch>  {

	void join(User user);
	void findPw(UserSearch userSearch);
	int checkIdDuplicate(UserSearch userSearch);
	void updateUserLoginFail(User user);
	void updateInitUserLoginFailCnt(User user);
	int userPwdCheck(UserSearch userSearch);
	void updatePwd(User user);
	int userTotalOutCount();
	int thisWeekInUserCount();
	int thisWeekOutUser();
	List<User> thisWeekInUser();

	Long getAutoIncNumber();

	Map<String, Object> insertRoleUserTransactional(User user);
	Map<String, String> joinTransactional(User user);
	Map<String, Object> updateTransactional(User user);
	Map<String, Object> userOutTransactional(User user);
	Map<String, Object> pwdUpdateTransactional(User user);
	Map<String, Object> userInsertTransactional(User user);
	Map<String, Object> userUpdateTransactional(User user);
	Map<String, String> userDeleteTransactional(User user);
	Map<String, String> initFailCntUpdateTransactional(User user);
	void reissueRestKeyTransactional(User user);

	int countWithRole(UserSearch userSearch);
	List<User> selectWithRole(UserSearch userSearch);
}
