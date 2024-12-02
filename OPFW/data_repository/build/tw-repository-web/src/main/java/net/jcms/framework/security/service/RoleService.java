package net.jcms.framework.security.service;

import net.jcms.framework.base.service.BaseService;
import net.jcms.framework.security.model.Role;

public interface RoleService extends BaseService<Role, Role> {
	Integer existCount (Role role);
}
