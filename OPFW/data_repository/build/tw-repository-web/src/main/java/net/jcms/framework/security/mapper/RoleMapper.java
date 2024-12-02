package net.jcms.framework.security.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.security.model.Role;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface RoleMapper extends BaseMapper<Role, Role>{

	Integer existCount(Role role);
	

}
