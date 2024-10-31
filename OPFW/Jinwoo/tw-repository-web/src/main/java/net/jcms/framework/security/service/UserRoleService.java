package net.jcms.framework.security.service;

import net.jcms.framework.base.service.BaseService;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserRole;

import java.util.List;

public interface UserRoleService extends BaseService<UserRole, UserRole> {
	Integer existCount (UserRole userRole);

	List<User> selectListWithUserInfo(UserRole userRole);
	User selectWithUserInfo(UserRole userRole);

	List<UserRole> selectRoleList(UserRole userRole);

	int insert(UserRole userRole);
}
