package net.jcms.framework.security.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserRole;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface UserRoleMapper extends BaseMapper<UserRole, UserRole>{

	Integer existCount(UserRole userRole);

	List<User> selectListWithUserInfo(UserRole userRole);
	User selectWithUserInfo(UserRole userRole);

	List<UserRole> selectRoleList(UserRole userRole);
}
