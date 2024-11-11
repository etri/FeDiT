package net.jcms.framework.menu.tag;

import net.jcms.framework.base.tag.BaseTag;
import net.jcms.framework.menu.model.Menu;
import net.jcms.framework.menu.service.MenuService;
import net.jcms.framework.security.model.User;
import net.jcms.framework.util.SessionHelper;
import org.springframework.beans.factory.annotation.Autowired;

import javax.servlet.jsp.JspWriter;
import java.io.IOException;
import java.util.List;

public class SideMenuTag extends BaseTag{

	/*private UserRoleService userRoleService;
	private MenuService menuService;
	private MenuRoleService menuRoleService;
	private StringBuffer sb;
	private Long menuId;*/
	
	@Autowired
	private MenuService menuService;
	
	private Long menuId;
	
	@Override
	protected int doProcessTag() throws IOException {
		//userRoleService = getRequestContext().getWebApplicationContext().getBean(UserRoleService.class);
		//menuService = getRequestContext().getWebApplicationContext().getBean(MenuService.class);
		//menuRoleService = getRequestContext().getWebApplicationContext().getBean(MenuRoleService.class);
		
		//현재 접속한 메뉴번호를 구한다.
		if(this.pageContext.getRequest().getParameter("currentMenuId") != null)
			menuId = Long.parseLong(this.pageContext.getRequest().getParameter("currentMenuId"));
		
		JspWriter out = pageContext.getOut ();
		StringBuffer sb = new StringBuffer(5000);
		
		/*if(!"anonymousUser".equals(EgovUserDetailsHelper.getAuthenticatedUser())) {
			User user = (User)EgovUserDetailsHelper.getAuthenticatedUser();
			
			List<String> roleAuthList = new ArrayList<String>();
			List<UserRole> userRoleList = userRoleService.selectJson();
			for(UserRole userRole : userRoleList) {
				if(userRole.getUserId().compareTo(user.getUserId()) == 0)
					roleAuthList.add(userRole.getRoleAuth());
			}
			List<Long> menuIdList = new ArrayList<Long>();
			List<MenuRole> menuRoleList = menuRoleService.selectJson();

			for(MenuRole menuRole : menuRoleList) {
				if(roleAuthList.contains(menuRole.getRoleAuth())) 
					menuIdList.add(menuRole.getMenuId());
			}
			
			List<Menu> menuList = menuService.selectJson();
			for(Menu menu : menuList) {
				makeChildMenu(menu, menuIdList);
			}
		}*/
		
		if(SessionHelper.getUser() != null) {
			User user = SessionHelper.getUser();
			if(user != null && user.getUserId() > 0) {
				List<Menu> menuList = menuService.selectRoleMenuList(user.getUserId(),false);
				for(Menu menu : menuList) {
					makeChildMenu(menu, sb);
				}
			}
			
		}
		out.print(sb.toString());
		return SKIP_BODY;
	}
	

	private void makeChildMenu(Menu menu, StringBuffer sb) {
		if (menu == null) {
			return;
		}
		if (menu.childList == null) {
			return;
		}
		
		String root = this.getRequestContext().getContextPath();
		if(root == null) root="";
		
		if(menu.childList.size() > 0) {
			sb.append("<li class='treeview ");
			if(menuId != null && searchChildUrlEquals(menu)) sb.append("active");
			sb.append("'>");
			sb.append("<a href='#'>");
			sb.append("<i class='material-icons' style='font-size:16px;'>"+menu.getIcon()+"</i> <span>"+menu.getMenuNm()+"</span> <i class='fa fa-angle-left pull-right'></i>");
			sb.append("</a>");
			sb.append("<ul class='treeview-menu'>");
			for(Menu childMenu : menu.childList) {
				makeChildMenu(childMenu, sb);
			}
			sb.append("</ul>");
			sb.append("</li>");
		}else {
			sb.append("<li ");
			if(menuId != null && menu.getMenuId().compareTo(menuId) == 0) sb.append("class='active'");
			sb.append(">");
			if(menu.getPgm().getPgmUrl().contains("?")){
				sb.append("<a href='" + root + menu.getPgm().getPgmUrl() + "&currentMenuId=" + menu.getMenuId() + "'>");
			}else {
				sb.append("<a href='" + root + menu.getPgm().getPgmUrl() + "?currentMenuId=" + menu.getMenuId() + "'>");
			}
			sb.append("<i class='material-icons' style='font-size:16px;'>"+menu.getIcon()+"</i> <span>"+menu.getMenuNm()+"</span>");
			sb.append("</a>");
			sb.append("</li>");
		}
	}
	/*
	private void makeChildMenu(Menu menu, List<Long> menuIdList) {
		if(menuIdList.contains(menu.getMenuId())) {
			if(menu.getChildList().size() > 0) {
				sb.append("<li class='treeview ");
				if(menuId != null && searchChildUrlEquals(menu)) sb.append("active");
				sb.append("'>");
				sb.append("<a href='#'>");
				sb.append("<i class='"+menu.getIcon()+"'></i> <span>"+menu.getMenuNm()+"</span> <i class='fa fa-angle-left pull-right'></i>");
				sb.append("</a>");
				sb.append("<ul class='treeview-menu'>");
				for(Menu childMenu : menu.getChildList()) {
					makeChildMenu(childMenu, menuIdList);
				}
				sb.append("</ul>");
				sb.append("</li>");
			}else {
				sb.append("<li ");
				if(menuId != null && menu.getMenuId().compareTo(menuId) == 0) sb.append("class='active'");
				sb.append(">");
				sb.append("<a href='"+menu.getPgm().getPgmUrl()+"?currentMenuId="+menu.getMenuId()+"'>");
				sb.append("<i class='"+menu.getIcon()+"'></i> <span>"+menu.getMenuNm()+"</span>");
				sb.append("</a>");
				sb.append("</li>");
			}
		}
	}*/

	/**
	 * 하위메뉴중에 선택한 메뉴가 있는지 찾는다. 
	 * @return true = 하위 메뉴중에 선택한 메뉴가 존재, false = 하위메뉴에 선택한 메뉴가 미존재
	 */
	private boolean searchChildUrlEquals(Menu menu) {
		boolean result = false;
		if(menu.getMenuId().compareTo(menuId) == 0) {
			return true;
		}
		for(Menu childMenu : menu.childList) {
			result = searchChildUrlEquals(childMenu);
			if(result) return true;
		}
		return result;
	}
}
