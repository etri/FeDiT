package net.jcms.framework.menu.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.menu.model.MenuConnHist;
import net.jcms.framework.menu.model.MenuConnHistSearch;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MenuConnHistMapper extends BaseMapper<MenuConnHist, MenuConnHistSearch> {

	List<MenuConnHistSearch> siteStats(MenuConnHistSearch menuConnHistSearch);
	
}
