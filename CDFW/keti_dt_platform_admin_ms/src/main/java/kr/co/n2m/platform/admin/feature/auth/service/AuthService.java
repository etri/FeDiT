package kr.co.n2m.platform.admin.feature.auth.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.admin.feature.apigroup.entity.Api;
import kr.co.n2m.platform.admin.feature.apigroup.entity.Apigroup;
import kr.co.n2m.platform.admin.feature.auth.entity.Auth;
import kr.co.n2m.platform.admin.feature.auth.entity.AuthApi;
import kr.co.n2m.platform.admin.feature.auth.entity.AuthMenu;
import kr.co.n2m.platform.admin.feature.auth.entity.AuthUser;
import kr.co.n2m.platform.admin.feature.auth.query.AuthApiRepository;
import kr.co.n2m.platform.admin.feature.auth.query.AuthMenuRepository;
import kr.co.n2m.platform.admin.feature.auth.query.AuthQuery;
import kr.co.n2m.platform.admin.feature.auth.query.AuthRepository;
import kr.co.n2m.platform.admin.feature.auth.query.AuthUserRepository;
import kr.co.n2m.platform.admin.feature.common.entity.PagingVO;
import kr.co.n2m.platform.admin.feature.menu.entity.Menu;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.keygen.UniqueKeyGenerator;
import kr.co.n2m.platform.common.property.Properties;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

/**
 * 권한 그룹 관리 서비스 구현 Class
 * 
 * @author (주)엔투엠
 */
@RequiredArgsConstructor
@Service
public class AuthService {

	private final AuthQuery authQuery;
	private final AuthRepository authRepository;
	private final AuthMenuRepository authMenuRepository;
	private final AuthUserRepository authUserRepository;
	private final AuthApiRepository authApiRepository;
	
	
	/** The unique key generator. */ 
	@Resource(name = "timeBaseUniqueKeyGenerator")
	private UniqueKeyGenerator uniqueKeyGenerator;
	
	@Autowired
	private Properties.AdminProperty superAdmin;
	
	/**
	 * 권한 그룹 목록을 가져온다.
	 *
	 * @param searchAuthGroupVO 검색 조건
	 * @return 권한 그룹 목록.
	 * @throws Exception the exception
	 */
	
	public Map<String, Object> getAuthListByPaging(Auth searchVo) {
		Map<String, Object> resultMap = new HashMap<>();
	
		long totalCount = authQuery.getAuthListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);
	
		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<Auth> list = authQuery.getAuthList(searchVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);
	
		return resultMap;
	}
	
	/** 권한 목록 조회. */
	public List<Auth> getAuthList(Auth searchVo) {
		return authQuery.getAuthList(searchVo);
	}

	/** 권한 목록 조회. (By pltfrmId, userId) */
	public List<Auth> getAuthListByPltfrmIdAndUserId(String pltfrmId, String userId) {
		if(userId == null){
			throw new RuntimeException("userId 입력은 필수입니다.");
		}
		return authQuery.getAuthListByPltfrmIdAndUserId(pltfrmId, userId);
	}

	/**
	 * 권한 그룹 조회
	 *
	 * @param grpOid 권한 그룹 Object ID.
	 * @return 권한 그룹 사용자 목록
	 * @throws Exception the exception
	 */
	public Auth getAuth(String autOid) {
		return authQuery.getAuth(autOid);
	}

	/**
	 * 권한 그룹을 생성한다.
	 *
	 * @param authGroupVO 권한 그룹 정보.
	 * @throws Exception the exception
	 */
	@Transactional
	public String createAuth(Auth authVo) {
		String authOid = uniqueKeyGenerator.getUniqueKey(null);
		
		authVo.setAutOid(authOid);
		
		if(! StringUtil.isEmpty(authOid)) {
			String findAuthOid = authQuery.getAutOid(authOid);
			if(authOid.equals(findAuthOid)) {
				return null;
			}
			
			String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
			if(userId != null) {
				authVo.setRegrId(userId);
			}
			String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
			if(userNm != null) {
				authVo.setRegrNm(userNm);
			}
		}
		
		authRepository.save(authVo);
		
		return authOid;
	}

	/**
	 * 권한 그룹 정보를 수정한다.
	 *
	 * @param grpOid      수정 할 권한 그룹 Object ID.
	 * @param authGroupVO 권한 그룹 정보
	 * @return 
	 * @throws Exception the exception
	 */
	@Transactional
	public String modifyAuth(Auth authVo) {
		String autOid = authVo.getAutOid();
		String findAutOid = authQuery.getAutOid(autOid);
		
		if(! StringUtil.isEmpty(findAutOid)) {
			if(findAutOid.equals(findAutOid)) {
				authVo.setAmdDt(LocalDateTime.now());
				
				String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(userId != null) {
					authVo.setAmdrId(userId);
				}
				
				String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
				if(userNm != null) {
					authVo.setAmdrNm(userNm);
				}
				
				authRepository.save(authVo);
				
				return autOid;
			}
		}
		return null;				
	}

	/**
	 * 해당 Object ID의 권한 그룹을 삭제한다.
	 *
	 * @param grpOid 권한 그룹 Object ID (null일 경우 전체 삭제)
	 * @throws Exception the exception
	 */
	@Transactional
	public void removeAuth(String authOid) {
		authQuery.removeAuth(authOid);
	}
	
	
	/**
	 * 권한에 대한 모든 데이터(auth, user, menu, api) 삭제
	 *
	 * @param grpOid 권한 그룹 Object ID (null일 경우 전체 삭제)
	 * @throws RuntimeException the exception
	 */
	@Transactional
	public void removeAuthData(String autOid) {
		try {
			//auth 데이터 삭제
			authQuery.removeAuth(autOid);
			
			//auth user 삭제
			authQuery.removeAuthUserList(autOid);
			
			//auth menu 삭제
			authQuery.removeAuthMenuList(autOid);
			
			//auth api 삭제
			authQuery.removeAuthApigroupList(autOid);
			
		} catch (RuntimeException e) {
			e.printStackTrace();
			throw e;
		}
	}
	
	
	/************************************** 권한 사용자 **************************************/

	
	/**
	 * 해당 Object ID 권한 그룹의 사용자 목록을 가져온다.
	 *
	 * @param grpOid 권한 그룹 Object ID.
	 * @return 사용자 목록
	 * @throws Exception the exception
	 */
	public List<AuthUser> getUserList(AuthUser searchVo) {
		return authQuery.getUserList(searchVo);
	}

	
	public AuthUser getUserDetail(AuthUser authUserEntity) {
		return authQuery.getUserDetail(authUserEntity);
	}

	/**
	 * 권한 그룹에 사용자를 추가한다.
	 *
	 * @param grpOid     권한그룹 Object ID.
	 * @param userIDList 사용자 ID 목록.
	 * @throws Exception the exception.
	 */
	@Transactional					
	public String createUserOid(String autOid, AuthUser authuserVo) {
		String getAutOid = authQuery.getAutOid(autOid);
	
		if (! autOid.equals(getAutOid)) {
			return null;
		} 
				
		authuserVo.setAutOid(autOid);
		
		authUserRepository.save(authuserVo);
		return autOid;		
	}

	/** 권한 사용자(멀티) 생성 */
	@Transactional 
	public void createAuthUsersList(String autOid, List<AuthUser> authuser) {
		for(AuthUser authUser : authuser ) { 
			createUserOid(autOid, authUser); 
		}
	}
	 
	/** 권한 관련 사용자들 삭제 */
	@Transactional
	public void removeAuthUserList(String autOid) {
		authQuery.removeAuthUserList(autOid);
	}
	
	/** 권한 관련 사용자 삭제 */
	@Transactional
	public void removeAuthUser(String autOid, String userid) {
		authQuery.removeAuthUser(autOid, userid);
	}


	
	/************************************** 권한 메뉴 **************************************/

	
	/** 메뉴 전체 목록 조회 */
	public List<Menu> getAuthMenuList(String autOid, Menu menuVo) {
		List<Menu> listResult = null;
		
		if(menuVo.getSearchType() != null) {
			switch (menuVo.getSearchType()) {
				case "tree":
					listResult = getMenuListHierarchy(autOid, menuVo);
					break;
			}
		} else {
			listResult = findRootMenuList(menuVo);
		}
		
		return listResult;
	}
	
	public List<Menu> getMenuListHierarchy(String autOid, Menu menuVo) {
		List<Menu> listRootMenu= authQuery.getMenu(menuVo);

		if (listRootMenu != null && !listRootMenu.isEmpty()) {
			 for (Menu menuVO : listRootMenu) {
				 setSubMenu(autOid, menuVO);
			 }
		} 
		return listRootMenu;
	}
	
	public List<Menu> findRootMenuList(Menu menuVo) {
		return authQuery.getMenu(menuVo);
	}
	

	
	/** 해당 OID의 하의 메뉴 목록을 가져온다. */
	public List<Menu> findSubMenuList(String autOid, Menu menuVo, boolean isIncludeChildren) {
		
		List<Menu> listSubMenu = authQuery.getMenu(menuVo);
		
		if (isIncludeChildren && listSubMenu != null) {
			for (Menu menuVO : listSubMenu) {
				setSubMenu(autOid, menuVO);
			}
		}
		return listSubMenu;
	}
	
	/** 해당 메뉴의 하위 메뉴를 모두 설정 */
	private void setSubMenu(String autOid, Menu menuVo) {
		List<Menu> listSubMenu = authQuery.setSubMenu(autOid, menuVo);
		
		if (listSubMenu != null && !listSubMenu.isEmpty()) {
			menuVo.setChildren(listSubMenu);
			for (Menu menuVO : listSubMenu) {
				setSubMenu(autOid, menuVO);
			}
		}
	}
	
	/** 권한 메뉴 상세 조회 */
	public Menu getAuthMenu(AuthMenu authMenuEntity) {
		return authQuery.getAuthMenu(authMenuEntity);
	}
	
	/** 권한 메뉴 생성 */
	@Transactional
	public String createMenuOid(String autOid, AuthMenu authmenuVo) {
		String menuOid = authmenuVo.getMenuOid();
		String findMenuOid = authQuery.getMenuOid(autOid, menuOid);
		String getAutOid = authQuery.getAutOid(autOid);
		
	
		if (! menuOid.equals(findMenuOid) && ! autOid.equals(getAutOid)) {
			return null;
		} 
				
		authmenuVo.setAutOid(autOid);
		authmenuVo.setMenuOid(menuOid);
		
		authMenuRepository.save(authmenuVo);
		return menuOid;		
	}
	
	/** 권한 메뉴(멀티) 생성 */
	@Transactional 
	public void createAuthMenusList(String autOid, List<AuthMenu> authmenu) {
		for(AuthMenu authMenu : authmenu ) { 
			createMenuOid(autOid, authMenu); 
		}
	}
	
	@Transactional
	public void removeAuthMenuList(String autOid) {
		authQuery.removeAuthMenuList(autOid);
	}
	
	@Transactional
	public void removeAuthMenu(AuthMenu searchVo) {
		authQuery.removeAuthMenu(searchVo);
	}
	
	
	/************************************** 권한 API 그룹 **************************************/
	
	
	/** 권한 API 그룹 목록 조회 */ 
	public List<Apigroup> getApigroupList(Apigroup searchVo) {
		return authQuery.getApigroupList(searchVo);
	}
	
	/** 권한 API 그룹 상세 조회 */ 
	public Apigroup getApigroupDetail(AuthApi apiVo) {
		return authQuery.getApigroupDetail(apiVo);
	}

	/** 권한 API Oid 생성 */ 
	@Transactional
	public String createApiOid(String autOid, Apigroup apiVo) {
		String grpOid= apiVo.getGrpOid();
		String findGrpOid= authQuery.getGrpOid(autOid, grpOid);
		String getAutOid= authQuery.getAutOid(autOid);
		String getGrpOid= authQuery.getGrpOid(grpOid);
		
		if(! grpOid.equals(findGrpOid) && ! autOid.equals(getAutOid)) {
			return null;
		}
		
		AuthApi api = new AuthApi();
		api.setAutOid(getAutOid);
		api.setGrpOid(getGrpOid);
		
		authApiRepository.save(api);
		return grpOid;
	}
	
	/** 권한 API(멀티) Oid 생성 */
	@Transactional 
	public void createApiOidList(String autOid, List<Apigroup> apiVo) {
		for(Apigroup authApi : apiVo ) { 
			createApiOid(autOid, authApi); 
		}
	}
		
	/** 권한 API 그룹 전체 삭제 */
	@Transactional
	public void removeAuthApigroupList(String oid) {
		authQuery.removeAuthApigroupList(oid);
	}

	/** 권한 API 그룹 삭제 */
	@Transactional
	public void removeAuthApigroup(String oid) {
		authQuery.removeAuthApigroup(oid);
	}

	/** 권한 api + user + url 정보로 확인 */
	public boolean getAuthorizationData(Map<String, String> authMap, List<String> defaultAutOidList) {
		List<Api> apiList = authQuery.findApiFromUserID(authMap.get("userId"), defaultAutOidList);
		
		//관련 api 리스트 가지고 와서 현재 url과 비교 후 있으면 true, 없으면 false
		return getAuthorizationFormUrl(apiList, authMap);
	}

	private boolean getAuthorizationFormUrl(List<Api> urlList, Map<String, String> authMap) {
		// TODO Auto-generated method stub
		for (int i = 0; i < urlList.size(); i++) {
            String dbUrl = urlList.get(i).getApiUrl();
            String dbMethod = urlList.get(i).getMthdCd();
            String regex = "";

            // DB URL에 %s가 존재하는 경우
            if (dbUrl.contains("%s")) {
                regex = dbUrl.replaceAll("%s", "(.*)");
            }
            // DB URL에 %s가 없는 경우
            else {
                regex = dbUrl;
            }
            
            // 2023-11-24 API DB 변경. /api/admin/codegroup -> /admin/codegroup
//            if(regex.contains("/api/")) {
//            	regex = regex.replaceFirst("/api", "");
//            }
            
            // 정규식을 사용하여 DB URL에서 추출한 부분과 method 데이터를 비교
            if (authMap.get("url").matches(regex)) {
            	if(dbMethod.equals(authMap.get("method"))) {
            		return true;
            	}
            }
        }

        // DB에 일치하는 URL 정보가 없는 경우 -1을 반환
        return false;
	}

	public String getSuperAdmin() {
		// TODO Auto-generated method stub
		return superAdmin.getAdmin();
	}

}
