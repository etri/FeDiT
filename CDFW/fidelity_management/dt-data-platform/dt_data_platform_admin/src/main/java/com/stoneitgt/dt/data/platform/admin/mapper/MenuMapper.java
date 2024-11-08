package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import com.stoneitgt.dt.data.platform.domain.Menu;
import com.stoneitgt.dt.data.platform.domain.MenuAuth;

@Mapper
public interface MenuMapper {

	List<Map<String, Object>> getUserMenuList(String auth);

	Map<String, Object> getBreadcrumb(String menuCode);

	List<Map<String, Object>> getMenuList(Map<String, Object> params);

	List<Map<String, Object>> getAuthMenuList(String auth);

	int deleteAuthMenu(MenuAuth menuAuth);

	int saveAuthMenu(MenuAuth menuAuth);

	List<String> getAuthMenuParent(String auth);

	List<Map<String, Object>> getParentMenuList(Map<String, Object> params);

	int saveMenu(Menu menu);

	int deleteMenu(Menu menu);

	int deleteMenuParent(Menu menu);

	Map<String, Object> getMenu(String menuCode);

	Map<String, Object> getFindParentByMenuCode(String menuCd);
}
