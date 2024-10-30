package net.jcms.framework.menu.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.menu.model.Menu;
import net.jcms.framework.menu.model.MenuSearch;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MenuMapper extends BaseMapper<Menu, MenuSearch> {

	void updateOrder(Menu menu);
	
	List<Menu> selectRoleMenuList(MenuSearch menuSearch);
	
	int selectMaxMenuOrder(MenuSearch menuSearch);
	
}
