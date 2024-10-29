package kr.co.n2m.platform.admin.feature.auth.entity;

import java.util.ArrayList;
import java.util.List;

import org.apache.ibatis.type.Alias;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import kr.co.n2m.platform.admin.feature.common.entity.BaseVO;

/**
 * AuthVO
 * 
 * @author (주)엔투엠
 */
@Alias("authMenuVO")			
public class AuthMenuVO extends BaseVO {
						
	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = 1455406191156933846L; 

	/** 메뉴 Object ID. */
	private String menuOid;
	
	private String menuParentOid;

	/** The menu id. */
	private String menuID;

	/** 메뉴 명. */
	private String menuName;

	/** 권한 Object ID. */
	private String autOid;

	/** 읽기 권한 여부 (active : 1, deactive: 0). */
	private boolean readYn;

	/** 쓰기 권한 여부 (active : 1, deactive: 0). */
	private boolean writeYn;

	/** 메뉴 권한 */
	//private boolean adminTF;

	//private boolean actTF;

	/** 하위 메뉴 목록. */
	private List<AuthMenuVO> children;

	private String key;

	private String title;

	private boolean folder = true;

	private boolean expanded = true;

	public boolean isExpanded() {
		return expanded;
	}

	public void setExpanded(boolean expanded) {
		this.expanded = expanded;
	}

	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public boolean isFolder() {
		return (children == null || children.size() <= 0) ? false : true;
	}

	public void setFolder(boolean folder) {
		this.folder = folder;
	}

	/**
	 * Gets the menu oid.
	 *
	 * @return the menu oid
	 */
	public String getMenuOid() {
		return menuOid;
	}

	/**
	 * Sets the menu oid.
	 *
	 * @param mnuOid the new menu oid
	 */
	public void setMenuOid(String menuOid) {
		this.menuOid = menuOid;
	}

	public String getMenuID() {
		return menuID;
	}

	public void setMenuID(String menuID) {
		this.menuID = menuID;
	}

	/**
	 * Gets the menu name.
	 *
	 * @return the menu name
	 */
	public String getMenuName() {
		return menuName;
	}

	/**
	 * Sets the menu name.
	 *
	 * @param menuName the new mnu name
	 */
	public void setMenuName(String menuName) {
		this.menuName = menuName;
	}

	/**
	 * Gets the aut oid.
	 *
	 * @return the aut oid
	 */
	public String getAutOid() {
		return autOid;
	}

	/**
	 * Sets the aut oid.
	 *
	 * @param grpOid the new aut oid
	 */
	public void setAutOid(String autOid) {
		this.autOid = autOid;
	}


	/**
	 * Adds the sub menu.
	 *
	 * @param menuVO the menu vo
	 */
	public void addChild(AuthMenuVO authVO) {
		if (this.children == null) {
			this.children = new ArrayList<AuthMenuVO>();
		}

		this.children.add(authVO);
	}

	/**
	 * Gets the children.
	 *
	 * @return the children
	 */
	public List<AuthMenuVO> getChildren() {
		return children;
	}

	/**
	 * Sets the children.
	 *
	 * @param children the new children
	 */
	public void setChildren(List<AuthMenuVO> children) {
		this.children = children;
	}

	/**
	 * Get adminYN
	 * 
	 * @return
	 */
	/*
	 * public String getAdminYNName() { if
	 * (ACTIVE_STATE.YES.toString().equals(String.valueOf(adminTF))) { return
	 * "관리자 메뉴"; } else { return "일반 메뉴"; } }
	 */


	/**
	 * Get ActYN name
	 * 
	 * @return
	 */
	/*
	 * public String getActYNName() { if
	 * (ACTIVE_STATE.YES.toString().equals(String.valueOf(actTF))) { return "활성"; }
	 * else { return "비활성"; } }
	 */

	public String getMenuParentOid() {
		return menuParentOid;
	}

	public void setMenuParentOid(String menuParentOid) {
		this.menuParentOid = menuParentOid;
	}

}
