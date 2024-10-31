package net.jcms.framework.security.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.security.mapper.ScurRscRoleMapper;
import net.jcms.framework.security.model.ScurRscRole;
import net.jcms.framework.security.service.ScurRscRoleService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service(value="scurRscRoleService")
public class ScurRscRoleServiceImpl extends BaseServiceAbst<ScurRscRole, ScurRscRole, ScurRscRoleMapper> implements ScurRscRoleService{

		@Override
		@Resource (name="scurRscRoleMapper")
		protected void setMapper (ScurRscRoleMapper mapper) {
			super.setMapper(mapper);
		}
	
}