package net.jcms.framework.menu.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.menu.mapper.MenuRoleMapper;
import net.jcms.framework.menu.model.MenuRole;
import net.jcms.framework.menu.model.MenuRoleSearch;
import net.jcms.framework.menu.service.MenuRoleService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service(value="menuRoleService")
public class MenuRoleServiceImpl extends BaseServiceAbst<MenuRole, MenuRoleSearch, MenuRoleMapper> implements MenuRoleService {

	@Override
	@Resource (name="menuRoleMapper")
	protected void setMapper (MenuRoleMapper mapper) {
		super.setMapper (mapper);
	}
	
}
