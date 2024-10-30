package net.jcms.framework.menu.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.menu.mapper.MenuMapper;
import net.jcms.framework.menu.model.Menu;
import net.jcms.framework.menu.model.MenuSearch;
import net.jcms.framework.menu.service.MenuService;
import net.jcms.framework.pgm.mapper.PgmMapper;
import net.jcms.framework.pgm.model.Pgm;
import net.jcms.framework.pgm.model.PgmSearch;
import net.jcms.framework.pgm.service.PgmService;
import net.jcms.framework.security.mapper.RoleMapper;
import net.jcms.framework.security.model.UserRole;
import net.jcms.framework.security.service.UserRoleService;
import net.jcms.framework.util.ApplicationHelper;
import net.jcms.framework.util.StrUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;
 
@Service(value="menuService")
public class MenuServiceImpl extends BaseServiceAbst<Menu, MenuSearch, MenuMapper> implements MenuService {

	public static List<Menu> userMenuList = null;
	
	@Resource (name="pgmService")
	private PgmService pgmService;
	
	@Autowired
	private UserRoleService userRoleService;

	@Override
	@Resource (name="menuMapper")
	protected void setMapper (MenuMapper mapper) {
		super.setMapper (mapper);
	}
	
	@Resource (name="pgmMapper")
	private PgmMapper pgmMapper;
	
	@Resource (name="roleMapper")
	private RoleMapper roleMapper;
	
	@Override
	public Menu select(MenuSearch menuSearch) {
		//List<Pgm> pgmList = pgmService.selectJson();
		PgmSearch pgmSearch = new PgmSearch();
		List<Pgm> pgmList = pgmService.selectList(pgmSearch);
		
		Menu menu = super.select(menuSearch); 
		if(menu.getUpperMenuId() != null) {
			menuSearch = new MenuSearch();
			menuSearch.setMenuId(menu.getUpperMenuId());
			menu.setUpperMenu(super.select(menuSearch));
		}
		for(Pgm pgm : pgmList) {
			if(pgm.getPgmId().compareTo(menu.getPgmId()) == 0) {
				menu.setPgm(pgm);
				break;
			}
		}
		return menu;
	}

	@Override
	public List<Menu> selectList(MenuSearch menuSearch) {
		menuSearch.setSort("MENU_ORD");
		menuSearch.setSortOrd("ASC");
		List<Menu> menuList = super.selectList(menuSearch);
		return setChildList(menuList);
	}
	
	public List<Menu> setChildList(List<Menu> menuList) {
		PgmSearch pgmSearchList = new PgmSearch();
		//List<Pgm> pgmList = pgmService.selectJson();
		List<Pgm> pgmList = pgmService.selectList(pgmSearchList);
		List<Menu> resultList = new ArrayList<Menu>();
		MenuSearch menuSearch;
		for(Menu menu : menuList) {
			menuSearch = new MenuSearch();
			menuSearch.setUpperMenuId(menu.getMenuId());
			menuSearch.setSort("MENU_ORD");
			menuSearch.setSortOrd("ASC");
			menu.childList = setChildList(mapper.selectList(menuSearch));
			
			PgmSearch pgmSearch = new PgmSearch ();
			pgmSearch.setPgmId (menu.getPgmId ());
			menu.setPgm (pgmMapper.select (pgmSearch));
			
			if(menu.getUpperMenuId() != null) {
				menuSearch = new MenuSearch();
				menuSearch.setMenuId(menu.getUpperMenuId());
				menu.setUpperMenu(super.select(menuSearch));
			}
			
			/*for(Pgm pgm : pgmList) {
				if(pgm.getPgmId().compareTo(menu.getPgmId()) == 0) {
					menu.setPgm(pgm);
					break;
				}
			}*/
			resultList.add(menu);
		}
		return resultList;
	}

	@Override
	public void updateOrder(Menu menu) {
		mapper.updateOrder(menu);
	}

	@Override
	public List<Menu> selectJson() {
		if(ApplicationHelper.menuList == null) {
			initJson();
		}
		return ApplicationHelper.menuList;
	}

	@Override
	public void initJson() {
		MenuSearch menuSearch = new MenuSearch();
		ApplicationHelper.menuList = selectList(menuSearch);
	}

	public List<Menu> selectRoleMenuList(MenuSearch menuSearch){
		menuSearch.setSort("MENU_ORD");
		menuSearch.setSortOrd("ASC");
		List<Menu> menuList = mapper.selectRoleMenuList(menuSearch);
		return setChildRoleMenuList(menuList, menuSearch.getRoleAuth());
	}
	
	public List<Menu> setChildRoleMenuList(List<Menu> menuList, List<String> rlist) {
		List<Menu> resultList = new ArrayList<Menu>();
		MenuSearch menuSearch;
		for(Menu menu : menuList) {
			menuSearch = new MenuSearch();
			menuSearch.setUpperMenuId(menu.getMenuId());
			menuSearch.setSort("MENU_ORD");
			menuSearch.setSortOrd("ASC");
			menuSearch.setRoleAuth(rlist);
			menu.childList = setChildRoleMenuList(mapper.selectRoleMenuList(menuSearch), rlist);
			
			PgmSearch pgmSearch = new PgmSearch ();
			pgmSearch.setPgmId (menu.getPgmId ());
			menu.setPgm (pgmMapper.select (pgmSearch));
			
			if(menu.getUpperMenuId() != null) {
				menuSearch = new MenuSearch();
				menuSearch.setMenuId(menu.getUpperMenuId());
				menu.setUpperMenu(super.select(menuSearch));
			}
			resultList.add(menu);
		}
		return resultList;
	}
	
	public void initRoleMenuList() {
		/*Role role = new Role();
		List<Role> roleList = roleMapper.selectList(role);
		
		Map<String, List<Menu>> menuMap = new HashMap<String, List<Menu>>();
		for(Role roleAuth : roleList){
			MenuSearch menuSearch = new MenuSearch();
			menuSearch.setRoleAuth(roleAuth.getRoleAuth());
			List<Menu> result = this.selectRoleMenuList(menuSearch);
			menuMap.put(roleAuth.getRoleAuth(), result);
		}
		ApplicationHelper.setMenuMap(menuMap);*/
	}

	public List<Menu> selectRoleMenuList(Long uid, boolean refresh) {
		if(uid>0 && refresh==false && userMenuList!=null) {
			return userMenuList;
		} 
		
		UserRole userRole = new UserRole();
		userRole.setUserId(uid);
		List<UserRole> userRoleList = userRoleService.selectList(userRole);		
		if((userRoleList.size()>0) && (userMenuList == null || refresh))  {
			List<String> rlist = new ArrayList<String>();
			for(UserRole it : userRoleList) {
				rlist.add(it.getRoleAuth());
			}
			MenuSearch menuSearch = new MenuSearch();
			menuSearch.setSort("MENU_ORD");
			menuSearch.setSortOrd("ASC");			
			menuSearch.setRoleAuth(rlist);

			List<Menu> menuList = mapper.selectRoleMenuList(menuSearch);
			userMenuList = setChildRoleMenuList(menuList, rlist);
		}
		return userMenuList;
	}

	@Override
	public boolean checkUrlAuth(String url) {
		if(StrUtil.isEmpty(url)) return false;
		if(userMenuList == null || userMenuList.size()<1) return false;
		
		String upath = Menu.getUrlPath(url);
		if(StrUtil.isEmpty(upath)) return false;
		
		for(Menu menu : userMenuList) {
			if(_chkMenuAuth(menu, upath)) return true;
		}
		return false;
	}

	private boolean _chkMenuAuth(Menu menu, String upath) {
		if(upath.equals(menu.getPgmPath())) return true;
		for(Menu mn : menu.childList) {
			if(_chkMenuAuth(mn, upath)) return true; 
		}
		return false;
	}
	
	@Override
	public int selectMaxMenuOrder(MenuSearch menuSearch) {
		return mapper.selectMaxMenuOrder(menuSearch);
	}
	
}
