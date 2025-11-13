package kr.co.n2m.platform.admin.feature.menu.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.annotation.Resource;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.admin.feature.menu.entity.Menu;
import kr.co.n2m.platform.admin.feature.menu.query.MenuQuery;
import kr.co.n2m.platform.admin.feature.menu.query.MenuRepository;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.entity.CamelCaseMap;
import kr.co.n2m.platform.common.keygen.UniqueKeyGenerator;
import kr.co.n2m.platform.common.property.Properties;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 메뉴 관리에 대한 ServiceImpl 클래스를 정의한다.
 * 메뉴 관리에 대한 등록, 조회, 수정, 삭제 기능 제공.
 * @author (주)엔투엠
 */

@Slf4j
@Service
@RequiredArgsConstructor
public class MenuService {

	private final MenuQuery query;
	private final MenuRepository menuRepository;
	
	@Autowired
	private Properties.AdminProperty superAdmin;
	
	/** The unique key generator. */
	@Resource(name = "timeBaseUniqueKeyGenerator")
	private UniqueKeyGenerator uniqueKeyGenerator;

	
	/** 사용자 권한에 매핑된 메뉴 목록 조회 */
	public List<CamelCaseMap> getUserMenu(String userId, String searchType, String pltfrmId, String admrYn, String typeCd,  String readYn, List<String> defaultAutOidList) {
		String searchUserId = "";
		if (userId == null || "".equals(userId)) {
			searchUserId = ""; // TODO Token 에서 조회
		}
		else {
			searchUserId = userId;
		}
		List<CamelCaseMap> resultMenuList = new ArrayList<>();
		if(StringUtil.equals(userId, superAdmin.getAdmin())) {
			resultMenuList = menuRepository.getSuperUser(pltfrmId, admrYn, typeCd, readYn);
		}else {
			resultMenuList = menuRepository.getUserMenu(searchUserId, pltfrmId, admrYn, typeCd, readYn, defaultAutOidList);
		}
		
			log.info("GET User Menu : ");
		
		if ( searchType != null && "tree".equals(searchType) ) {
			return parseHierarchyMenu(resultMenuList);	
		}
		
		return resultMenuList;
	}

	/** 전체 메뉴 목록 조회 */
	private List<CamelCaseMap> parseHierarchyMenu(List<CamelCaseMap> list) {
		
		List<CamelCaseMap> listRoot = list.stream().filter(menu -> "0".equals(menu.get("upMenuOid"))).collect(Collectors.toList());
		
		for (CamelCaseMap root : listRoot) {
			subMenu(root, list, (String) root.get("menuOid"));
		}

		return listRoot;
	}
	
	/** 하위 메뉴 설정 */
	private void subMenu(CamelCaseMap target, List<CamelCaseMap> list, String upMenuOid) {
		List<CamelCaseMap> listChildren = list.stream().filter(menu -> upMenuOid.equals(menu.get("upMenuOid"))).collect(Collectors.toList());
		
		if (listChildren.size() > 0) {
			target.put("children", listChildren);

			for (CamelCaseMap child : listChildren) {
				subMenu(child, list, (String) child.get("menuOid"));
			}
		}
		else {
			target.put("children", new ArrayList<>());
		}
	}
	
	
	/** 메뉴 전체 목록 조회 */
	public List<Menu> getMenuList(Menu menuVo) {
		List<Menu> listResult = null;
		
		if(menuVo.getSearchType() != null) {
			switch (menuVo.getSearchType()) {
				case "tree":
					listResult = getMenuListHierarchy(menuVo);
					break;
			}
		}else if(menuVo.getPltfrmId() != null || menuVo.getAdmrYn() != null || menuVo.getTypeCd() != null){
			listResult = getPltfrmIdMenuList(menuVo);
			
		}else {
			listResult = findRootMenuList(menuVo);
		}
		
		return listResult;
	}

	/**
	 * 전체 메뉴 목록을 가져온다. (계층)
	 *
	 * @param portalCatCode 포탈 구분 코드 enum (사용자 또는 운영자 포탈)
	 * @param activeState 활성 상태
	 * @return 전체 메뉴 목록 (최상위 목록)
	 * @throws Exception the exception
	 */
	public List<Menu> getMenuListHierarchy(Menu menuVo) {
		List<Menu> listRootMenu= query.getMenu(menuVo);

		if (listRootMenu != null && !listRootMenu.isEmpty()) {
			 for (Menu menuVO : listRootMenu) {
				 setSubMenu(menuVO);
			 }
		} 
		return listRootMenu;
	} 

	/**
	 * 최 상위 메뉴 목록을 가져온다.
	 *
	 * @param portalCatCode 포탈 구분 코드 enum (사용자 또는 운영자 포탈)
	 * @param activeState   활성 상태 enum
	 * @param adminState    관리자 메뉴 여부
	 * @return 최 상위 메뉴 목록
	 * @throws Exception the exception
	 */
	public List<Menu> findRootMenuList(Menu menuVo) {
		return query.getMenu(menuVo);
	}
	
	/** pltfrmId 기준 메뉴 목록 조회 */
	public List<Menu> getPltfrmIdMenuList(Menu menuVo) {
		List<Menu> listRootMenu= query.getPltfrmIdMenu(menuVo);

		if (listRootMenu != null && !listRootMenu.isEmpty()) {
			 for (Menu menuVO : listRootMenu) {
				 setSubMenu(menuVO);
			 }
		} 
		return listRootMenu;
	} 

	/**
	 * 해당 Object OID의 하위 메뉴 목록을 가져온다.
	 *
	 * @param parentOid        메뉴 Object ID
	 * @param activeState      활성 상태 ENUM
	 * @param isIncludeChidren 하위 메뉴 포함 여부.
	 * @return 최 상위 메뉴 목록
	 * @throws Exception the exception
	 */
	public List<Menu> findSubMenuList(Menu menuVo, boolean isIncludeChildren) {
		
		List<Menu> listSubMenu = query.getMenu(menuVo);
		
		if (isIncludeChildren && listSubMenu != null) {
			for (Menu menuVO : listSubMenu) {
				setSubMenu(menuVO);
			}
		}
		return listSubMenu;
	}

	/**
	 * 해당 메뉴의 하위 메뉴를 모두 설정해준다.
	 *
	 * @param parentMenuVO 하위 메뉴를 설정할 상위 메뉴 정보
	 */
	private void setSubMenu(Menu menuVo) {	
		List<Menu> listSubMenu= query.setSubMenu(menuVo);
		
		if (listSubMenu != null && !listSubMenu.isEmpty()) {
			menuVo.setChildren(listSubMenu);
			for (Menu menuVO : listSubMenu) {
				setSubMenu(menuVO);
			}
		}
	}

	/**
	 * 해당 Object ID의 메뉴 정보를 조회한다.
	 *
	 * @param menuOid 조회할 메뉴 Object ID
	 * @return 메뉴 정보
	 * @throws Exception the exception
	 */
	public Menu getMenu(String oid) {
		return query.getMenu(oid);
	}
	
	/**
	 * 메뉴를 생성 한다.
	 *
	 * @param menuVO – 메뉴 정보 VO
	 * @throws Exception the exception
	 */
	@Transactional
	public String createMenu(Menu menuVo) {
		String menuOid = uniqueKeyGenerator.getUniqueKey(null);
		
		menuVo.setMenuOid(menuOid);

		String nextID = query.setNextId(menuVo);

		menuVo.setMenuOid(menuOid);
		menuVo.setMenuId(String.format("MNU_%06d", Integer.parseInt(nextID) + 1));
		
		if(StringUtils.equals(menuVo.getMenuUrl(), "")) {
			menuVo.setMenuUrl(null);
		}

		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			menuVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			menuVo.setRegrNm(userNm);
		}
		
		menuRepository.save(menuVo);

		return menuOid;
	}

	/**
	 * 해당 Object ID의 메뉴 정보를 수정한다.
	 *
	 * @param menuOid 수정 할 메뉴 정보 Object ID
	 * @param menuVO 수정 할 메뉴 정보.
	 */
	// public void modifyMenu(String menuOid, MenuVO menuVO) {
	@Transactional
	public String modifyMenu(Menu menuVo) {
		String menuOid = menuVo.getMenuOid();
		String findMenuOid = query.findByMenuOid(menuOid);

		if(StringUtil.equals(menuOid, findMenuOid)) {
			
			String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
			if(userId != null) {
				menuVo.setAmdrId(userId);
			}
			
			String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
			if(userNm != null) {
				menuVo.setAmdrNm(userNm);
			}
			
			if ("".equals(menuVo.getMenuUrl())) {
				menuVo.setMenuUrl(null);
			}
			
			menuRepository.save(menuVo);
			return menuVo.getMenuOid();
		}
		return null;
		
	}

	/**
	 * 해당 Object ID의 메뉴를 삭제한다.
	 */
	@Transactional
	public void removeMenu(String menuOid) {
		List<Menu> listSubMenu = query.getRemoveMenu(menuOid);

		if (listSubMenu != null && !listSubMenu.isEmpty()) {
			query.removeMenu(menuOid);
		}
	}

	/**
	 * 해당 Object ID의 메뉴 네이게이션 목록을 조회한다.
	 *
	 * @param menuOid 목록 조회 할 메뉴 정보 Object ID
	 */
	public Map<String, Object> getBreadCrumbMenu(String userId, String menuOid,String typeCd) {
		/* 
		 * Map에 넣어야하는 데이터 = breadCrumb : menu 네이게이션 배열 
		 1. menuOid의 메뉴 정보를 가지고 온다.
		 1-1. 만약 upMenuOid가 없으면 해당 정보만 return한다.
		 1-2. upMenuOid가 있으면 해당 메뉴의 upMenuOid 정보를 가지고 온 후 return한다.
		 * */
		Map<String, Object> breadCrumbMenu  = new HashMap<>();
		
		//1번 진행
		List<Menu> menuList = new ArrayList();
		List<Menu> breadCrumbMenuList = findBreadCrumbMenu(menuList, menuOid);
		
		Map<String, Object> resultMap = new HashMap<>();
		resultMap.put("breadCrumb" , breadCrumbMenuList);
	
		return resultMap;
	}


	private List<Menu> findBreadCrumbMenu(List<Menu> menuList, String menuOid) {
		Menu menu = getMenu(menuOid);
		
		if(menu != null) {
			menuList.add(0, menu);
			if(menu.getUpMenuOid() != "0") findBreadCrumbMenu(menuList, menu.getUpMenuOid());
		}else return null;
		
		return menuList;
	}

	
	
}
