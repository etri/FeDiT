package net.jcms.framework.menu.mapper;
 
import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.menu.model.MenuRole;
import net.jcms.framework.menu.model.MenuRoleSearch;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MenuRoleMapper extends BaseMapper<MenuRole, MenuRoleSearch> {

}
