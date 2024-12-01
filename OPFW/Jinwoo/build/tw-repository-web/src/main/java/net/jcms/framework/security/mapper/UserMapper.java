package net.jcms.framework.security.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserSearch;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface UserMapper extends BaseMapper<User, UserSearch> {
	
	User login (User user);
	int checkIdDuplicate(UserSearch userSearch);
	
	void updateUserLoginFail(User user);
	void updateInitUserLoginFailCnt(User user);
	int userPwdCheck(UserSearch userSearch);
	void updatePwd(User user);
	int userTotalOutCount();
	int thisWeekInUserCount();
	int thisWeekOutUser();
	List<User> thisWeekInUser();

	Long getAutoIncNumber ();

	int countWithRole(UserSearch userSearch);
	List<User> selectWithRole(UserSearch userSearch);
}
