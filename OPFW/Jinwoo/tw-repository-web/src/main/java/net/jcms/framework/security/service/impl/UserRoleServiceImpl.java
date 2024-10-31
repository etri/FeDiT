package net.jcms.framework.security.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.security.mapper.UserRoleMapper;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserRole;
import net.jcms.framework.security.service.UserRoleService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

@Service(value="userRoleService")
public class UserRoleServiceImpl extends BaseServiceAbst<UserRole, UserRole, UserRoleMapper> implements UserRoleService {

	@Override
	@Resource(name = "userRoleMapper")
	protected void setMapper(UserRoleMapper mapper) {
		super.setMapper(mapper);
	}

	@Override
	public Integer existCount(UserRole userRole) {
		return mapper.existCount(userRole);
	}

	@Override
	public List<User> selectListWithUserInfo(UserRole userRole){ return mapper.selectListWithUserInfo(userRole); }

	@Override
	public User selectWithUserInfo(UserRole userRole){ return mapper.selectWithUserInfo(userRole); }

	@Override
	public List<UserRole> selectRoleList(UserRole userRole) {
		return mapper.selectRoleList(userRole);
	}

	@Override
	public int insert(UserRole userRole) {
		super.delete(userRole);
		return super.insert(userRole);
	}
}
