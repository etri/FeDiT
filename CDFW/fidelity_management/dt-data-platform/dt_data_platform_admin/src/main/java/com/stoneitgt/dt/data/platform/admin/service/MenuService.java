package com.stoneitgt.dt.data.platform.admin.service;

import java.util.List;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.mapper.MenuMapper;
import com.stoneitgt.dt.data.platform.domain.Menu;
import com.stoneitgt.dt.data.platform.domain.MenuAuth;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.util.StringUtil;

@Slf4j
@Service
public class MenuService extends BaseService {

    @Autowired
    private MenuMapper menuMapper;

    public List<Map<String, Object>> getMenuList(Map<String, Object> params) {
        return menuMapper.getMenuList(params);
    }

    public Map<String, Object> getBreadcrumb(String menuCode) {
        return menuMapper.getBreadcrumb(menuCode);
    }

    public List<Map<String, Object>> getUserMenuList(String auth) {
        return menuMapper.getUserMenuList(auth);
    }

    public List<Map<String, Object>> getParentMenuList(Map<String, Object> params) {
        return menuMapper.getParentMenuList(params);
    }

    public Map<String, Object> getMenu(String menuCode) {
        return menuMapper.getMenu(menuCode);
    }

    public List<Map<String, Object>> getAuthMenuList(String auth) {
        return menuMapper.getAuthMenuList(auth);
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    public int saveAuthMenu(MenuAuth menuAuth) {
        log.info("menuAuth -> {}", menuAuth);
        int result = menuMapper.deleteAuthMenu(menuAuth);

        String auth = menuAuth.getAuthCd();
        int loginUserSeq = menuAuth.getLoginUserSeq();
        String loginUserIp = menuAuth.getLoginUserIp();

        List<String> values = menuAuth.getValues();
        log.info("values -> {}", values);
        for (String value : values) {
            MenuAuth new_menu_auth = new MenuAuth();
            new_menu_auth.setAuthCd(auth);
            new_menu_auth.setMenuCd(value);
            new_menu_auth.setLoginUserSeq(loginUserSeq);
            new_menu_auth.setLoginUserIp(loginUserIp);
            log.info("new_menu_auth -> {}", new_menu_auth);
            result += menuMapper.saveAuthMenu(new_menu_auth);
            Map<String, Object> parentAuth = menuMapper.getFindParentByMenuCode(new_menu_auth.getMenuCd());
            if (parentAuth != null) {
                log.info("parentAuth -> {}", parentAuth);
                new_menu_auth.setAuthCd(auth);
                new_menu_auth.setMenuCd(parentAuth.get("menu_cd").toString());
                new_menu_auth.setLoginUserSeq(loginUserSeq);
                new_menu_auth.setLoginUserIp(loginUserIp);
                result += menuMapper.saveAuthMenu(new_menu_auth);
            }
        }

        log.info("Auth -> {}", auth);
        List<String> parentList = menuMapper.getAuthMenuParent(auth);
        log.info("parentList -> {}", parentList);

        for (String parent : parentList) {
            MenuAuth new_menu_auth = new MenuAuth();
            new_menu_auth.setAuthCd(auth);
            new_menu_auth.setMenuCd(parent);
            new_menu_auth.setLoginUserSeq(loginUserSeq);
            new_menu_auth.setLoginUserIp(loginUserIp);
            log.info("parent new_menu_auth -> {}", new_menu_auth);
            result += menuMapper.saveAuthMenu(new_menu_auth);
        }

        return result;
    }

    public int saveMenu(Menu menu) {
        return menuMapper.saveMenu(menu);
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    public int deleteMenu(Menu menu) {
        int result = menuMapper.deleteMenu(menu);
        if ("TOP".equals(StringUtil.getString(menu.getUpMenuCd()))) {
            result += menuMapper.deleteMenuParent(menu);
        }
        return result;
    }

}
