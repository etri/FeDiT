package net.jcms.framework.security.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.security.mapper.RoleMapper;
import net.jcms.framework.security.model.Role;
import net.jcms.framework.security.service.RoleService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service(value="roleService")
public class RoleServiceImpl extends BaseServiceAbst<Role, Role, RoleMapper> implements RoleService {

	@Override
	@Resource(name = "roleMapper")
	protected void setMapper(RoleMapper mapper) {
		super.setMapper(mapper);
	}

	@Override
	public Integer existCount(Role role) {
		return mapper.existCount(role);
	}

	
}
