package net.jcms.framework.menu.service;

import net.jcms.framework.base.service.BaseService;
import net.jcms.framework.menu.model.MenuConnHist;
import net.jcms.framework.menu.model.MenuConnHistSearch;

import java.util.List;

public interface MenuConnHistService extends BaseService<MenuConnHist, MenuConnHistSearch> {

	List<MenuConnHistSearch> siteStats(MenuConnHistSearch menuConnHistSearch);
	
}
