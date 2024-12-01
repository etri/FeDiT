package com.stoneitgt.dt.data.platform.admin.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import org.passay.RuleResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.stoneitgt.common.GlobalConstant;

import lombok.extern.slf4j.Slf4j;

import com.stoneitgt.dt.data.platform.admin.component.PasswordConstraintValidator;
import com.stoneitgt.dt.data.platform.admin.service.CodeService;
import com.stoneitgt.dt.data.platform.admin.service.MenuService;
import com.stoneitgt.dt.data.platform.admin.service.UserService;
import com.stoneitgt.dt.data.platform.admin.service.UnitService;
import com.stoneitgt.dt.data.platform.admin.service.VerifyService;
import com.stoneitgt.dt.data.platform.domain.BaseParameter;
import com.stoneitgt.dt.data.platform.domain.CodeDtl;
import com.stoneitgt.dt.data.platform.domain.CodeMst;
import com.stoneitgt.dt.data.platform.domain.Unit;
import com.stoneitgt.dt.data.platform.domain.Verify;
import com.stoneitgt.dt.data.platform.domain.Menu;
import com.stoneitgt.dt.data.platform.domain.MenuAuth;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.domain.User;
import com.stoneitgt.dt.data.platform.util.StoneUtil;
import com.stoneitgt.dt.data.platform.util.StringUtil;

@Slf4j
@Controller
@RequestMapping("/setting")
public class SettingController extends BaseController {

    @Autowired
    private MenuService menuService;

    @Autowired
    private CodeService codeService;

    @Autowired
    private UserService userService;

    @Autowired
    private UnitService unitService;

    @Autowired
    private VerifyService verifyService;

    @GetMapping("/menu")
    public String menuList(@ModelAttribute BaseParameter params, Model model) {
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);

        List<Map<String, Object>> list = menuService.getMenuList(paramsMap);

        model.addAttribute("list", list);
        Paging paging = new Paging();
        paging.setShow(false);
        model.addAttribute("paging", StoneUtil.setTotalPaging2(list, paging));
        model.addAttribute("params", params);
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));

        return "pages/setting/menu_list";
    }

    @PostMapping("/menu/register")
    @ResponseBody
    public Map<String, Object> saveMenu(@RequestBody Menu menu, HttpServletRequest request) {
        menu.setLoginUserSeq(getSessionLoginUserSeq(request));
        menu.setLoginUserIp(getClientIP(request));
        menuService.saveMenu(menu);
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/menu/delete")
    @ResponseBody
    public Map<String, Object> deleteMenu(@RequestBody Menu menu, HttpServletRequest request) {
        menu.setLoginUserSeq(getSessionLoginUserSeq(request));
        menu.setLoginUserIp(getClientIP(request));
        menuService.deleteMenu(menu);
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/menu/load")
    @ResponseBody
    public Map<String, Object> getMenu(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("data", menuService.getMenu(StringUtil.getString(params.get("menuCd"))));
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/menu/parent")
    @ResponseBody
    public Map<String, Object> getParentMenuList(@RequestBody Map<String, Object> params) {
        List<Map<String, Object>> list = menuService.getParentMenuList(params);
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("code", "TOP");
        map.put("code_name", "선택하세요");
        list.add(0, map);
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("data", list);
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @GetMapping("/auth")
    public String authList(@ModelAttribute BaseParameter params, @RequestParam(required = false) String auth, Model model) {

        List<Map<String, Object>> menuList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> authMenuList = menuService.getAuthMenuList(auth);
        List<String> values = new ArrayList<String>();
        for (Map<String, Object> item : authMenuList) {
            if (StringUtil.getIntValue(item.get("level")) == 1) {
                Map<String, Object> menu = item;
                List<Map<String, Object>> children = getChildren(authMenuList, StringUtil.getString(item.get("id")));
                for (Map<String, Object> subNode : children) {
                    List<Map<String, Object>> tripleNodes = getChildren(authMenuList, StringUtil.getString(subNode.get("id")));
                    subNode.put("children", tripleNodes);
                    if (tripleNodes.size() == 0) {
                        if ("Y".equals(subNode.get("value").toString())) {
                            values.add(StringUtil.getString(subNode.get("id")));
                        }
                    } else {
                        for (Map<String, Object> tripleNode : tripleNodes) {
                            if ("Y".equals(tripleNode.get("value").toString())) {
                                values.add(StringUtil.getString(tripleNode.get("id")));
                            }
                        }
                    }
                }
                menu.put("children", children);
                menuList.add(menu);
                if (children.size() == 0) {
                    if ("Y".equals(item.get("value").toString())) {
                        values.add(StringUtil.getString(item.get("id")));
                    }
                }
            }
        }

        model.addAttribute("authList", getCodeList("AUTH", false));
        model.addAttribute("menuList", menuList);
        model.addAttribute("values", values);
        model.addAttribute("params", params);
        model.addAttribute("auth", auth);
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/setting/auth_list";
    }

    @PostMapping("/auth/register")
    @ResponseBody
    public Map<String, Object> saveAuthMenu(@RequestBody MenuAuth menuAuth, HttpServletRequest request) {
        menuAuth.setLoginUserSeq(getSessionLoginUserSeq(request));
        menuAuth.setLoginUserIp(getClientIP(request));
        menuService.saveAuthMenu(menuAuth);
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    private List<Map<String, Object>> getChildren(List<Map<String, Object>> list, String parent) {
        List<Map<String, Object>> children = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> item : list) {
            if (parent.equals(StringUtil.getString(item.get("parent_id")))) {
                children.add(item);
            }
        }
        return children;
    }

    @GetMapping("/code")
    public String codeList(@ModelAttribute BaseParameter params, @RequestParam(required = false) String grpCd, Model model) {
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);

        List<Map<String, Object>> masterList = codeService.getCodeMasterList(paramsMap);

        if (StringUtil.isNotBlank(grpCd)) {
            paramsMap.put("grpCd", grpCd);
        }

        List<Map<String, Object>> detailList = codeService.getCodeDetailList(paramsMap);

        model.addAttribute("masterList", masterList);
        model.addAttribute("detailList", detailList);
        model.addAttribute("params", params);
        model.addAttribute("grpCd", grpCd);
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/setting/code_list";
    }

    @PostMapping("/code/load")
    @ResponseBody
    public Map<String, Object> codeView(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        Map<String, Object> result = new HashMap<String, Object>();
        if ("M".equals(StringUtil.getString(params.get("type")))) {
            result.put("data", codeService.getCodeMaster(params));
        } else {
            result.put("data", codeService.getCodeDetail(params));
        }
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/code/master")
    @ResponseBody
    public Map<String, Object> codeMasterList(@RequestBody Map<String, Object> params) {
        List<Map<String, Object>> list = codeService.getCodeMasterList(params);
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("grp_cd", "");
        map.put("grp_cd_nm", "선택하세요");
        list.add(0, map);
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("data", list);
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/code/register/master")
    @ResponseBody
    public Map<String, Object> saveCodeMaster(@RequestBody CodeMst codeMst, HttpServletRequest request) {
        codeMst.setLoginUserSeq(getSessionLoginUserSeq(request));
        codeMst.setLoginUserIp(getClientIP(request));
        codeService.saveCodeMaster(codeMst);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/code/register/detail")
    @ResponseBody
    public Map<String, Object> saveCodeDetail(@RequestBody CodeDtl codeDtl, HttpServletRequest request) {

        codeDtl.setLoginUserSeq(getSessionLoginUserSeq(request));
        codeDtl.setLoginUserIp(getClientIP(request));

        codeService.saveCodeDetail(codeDtl);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/code/delete")
    @ResponseBody
    public Map<String, Object> deleteCodeMaster(@RequestBody CodeDtl codeDtl, HttpServletRequest request) {
        codeDtl.setLoginUserSeq(getSessionLoginUserSeq(request));
        codeDtl.setLoginUserIp(getClientIP(request));

        if ("M".equals(StringUtil.getString(codeDtl.getType()))) {
            codeService.deleteCodeMaster(codeDtl);
        } else {
            codeService.deleteCodeDetail(codeDtl);
        }
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @GetMapping("/user")
    public String userList(@ModelAttribute BaseParameter params, Model model) {

        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        paramsMap.put("user_type", "A");

        List<Map<String, Object>> list = userService.getUserList(paramsMap, paging);

        model.addAttribute("list", list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(list, paging));
        model.addAttribute("params", params);
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("pageParams", getBaseParameterString(params));

        return "pages/setting/user_list";
    }

    @GetMapping("/user/{userSeq}")
    public String userView(@PathVariable int userSeq, @ModelAttribute BaseParameter params, Model model) {
        model.addAttribute("user", userService.getUserInfo(userSeq));
        model.addAttribute("authList", getCodeList("AUTH"));
        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("pageParams", getBaseParameterString(params));
        return "pages/setting/user_form";
    }

    @GetMapping("/user/form")
    public String userForm(@ModelAttribute BaseParameter params, Model model) {
        model.addAttribute("user", new User());
        model.addAttribute("authList", getCodeList("AUTH"));
        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("pageParams", getBaseParameterString(params));
        return "pages/setting/user_form";
    }

    @PostMapping("/user/form")
    public String saveUser(@RequestParam(required = false) String menuCd, @ModelAttribute("user") @Valid User user, BindingResult bindingResult, Model model, RedirectAttributes rttr) {


        PasswordConstraintValidator passwordValidator = new PasswordConstraintValidator();
        if (user.getUserSeq() == 0) {

            for (String id : GlobalConstant.BLACK_ID_LIST) {
                if (id.equalsIgnoreCase(user.getId())) {
                    bindingResult.rejectValue("id", "id.black.pattern", new Object[]{id}, "");
                    break;
                }
            }

            if (userService.existedUserId(user.getId()) > 0) {
                bindingResult.rejectValue("id", "member.id.exists");
            }
            if (StringUtil.isBlank(user.getPassword())) {
                bindingResult.rejectValue("password", "field.required");
            }
            RuleResult ruleResult = passwordValidator.validate(user.getPassword());
            if (!ruleResult.isValid()) {
                bindingResult.rejectValue("password", "password.illegal_match");
            }
            if (!user.getPassword().equals(user.getPasswordConfirm())) {
                bindingResult.rejectValue("passwordConfirm", "password.illegal_match_confirm");
            }
        } else {

            if (StringUtil.isNotBlank(user.getTempPassword())) {

                RuleResult ruleResult = passwordValidator.validate(user.getTempPassword());
                if (!ruleResult.isValid()) {
                    bindingResult.rejectValue("tempPassword", "password.illegal_match");
                } else {
                    user.setNewPassword(user.getTempPassword());
                }
                if (!user.getTempPassword().equals(user.getTempPasswordConfirm())) {
                    bindingResult.rejectValue("tempPasswordConfirm", "password.illegal_match_confirm");
                } else {
                    user.setNewPassword(user.getTempPassword());
                }
            }
        }

        if (bindingResult.hasErrors()) {
            model.addAttribute("authList", getCodeList("AUTH"));
            model.addAttribute("menuCd", menuCd);
            model.addAttribute("breadcrumb", getBreadcrumb(menuCd));
            model.addAttribute("pageParams", user.getPageParams());
            return "pages/setting/user_form";
        }

        String returnUrl = "redirect:/setting/user?";

        if (user.getUserSeq() == 0) {
            //user.setUserType("A");
            rttr.addFlashAttribute("result_code", GlobalConstant.CRUD_TYPE.INSERT);
            returnUrl += "menuCd=" + menuCd;
        } else {
            rttr.addFlashAttribute("result_code", GlobalConstant.CRUD_TYPE.UPDATE);
            returnUrl += user.getPageParams();
        }
        user.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
        user.setLoginUserIp(authenticationFacade.getLoginUserIp());


        if (user.getUserSeq() == 0) {
            userService.saveUser(user);
        } else {
            userService.updateUser(user);
        }

        return returnUrl;
    }

    @GetMapping("/unit")
    public String unitList(@ModelAttribute BaseParameter params, @RequestParam(required = false) String dtlCd, Model model) {
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        List<Map<String, Object>> masterList = unitService.getUnitMasterList(paramsMap);

        if (StringUtil.isNotBlank(dtlCd)) {
            paramsMap.put("dtlCd", dtlCd);
        }

        List<Map<String, Object>> detailList = unitService.getUnitDetailList(paramsMap);

        model.addAttribute("masterList", masterList);
        model.addAttribute("detailList", detailList);
        model.addAttribute("params", params);
        model.addAttribute("dtlCd", dtlCd);
        model.addAttribute("unitList", getCodeList(dtlCd, false));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/setting/unit_list";
    }

    @PostMapping("/unit/load")
    @ResponseBody
    public Map<String, Object> unitView(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        Map<String, Object> result = new HashMap<String, Object>();
        if ("M".equals(StringUtil.getString(params.get("type")))) {
            result.put("data", unitService.getUnitMaster(params));
        } else {
            result.put("data", unitService.getUnitDetail(params));
        }
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/unit/master")
    @ResponseBody
    public Map<String, Object> unitMasterList(@RequestBody Map<String, Object> params) {
        List<Map<String, Object>> list = unitService.getUnitMasterList(params);
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("grp_cd", "");
        map.put("grp_cd_nm", "선택하세요");
        list.add(0, map);
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("data", list);
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/unit/register/detail")
    @ResponseBody
    public Map<String, Object> saveUnitDetail(@RequestBody Unit unit, HttpServletRequest request) {

        log.info(unit.toString());

        unit.setLoginUserSeq(getSessionLoginUserSeq(request));
        unit.setLoginUserIp(getClientIP(request));

        unitService.saveUnitDetail(unit);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/unit/delete")
    @ResponseBody
    public Map<String, Object> deleteUnitMaster(@RequestBody Unit unit, HttpServletRequest request) {
        unit.setLoginUserSeq(getSessionLoginUserSeq(request));
        unit.setLoginUserIp(getClientIP(request));

        unitService.deleteUnitDetail(unit);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @GetMapping("/vrfc")
    public String verifyList(@ModelAttribute BaseParameter params, @RequestParam(required = false) String dtlCd, Model model) {
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        List<Map<String, Object>> masterList = verifyService.getVerifyMasterList(paramsMap);

        if (StringUtil.isNotBlank(dtlCd)) {
            paramsMap.put("dtlCd", dtlCd);
        }

        List<Map<String, Object>> detailList = verifyService.getVerifyDetailList(paramsMap);

        model.addAttribute("masterList", masterList);
        model.addAttribute("detailList", detailList);
        model.addAttribute("params", params);
        model.addAttribute("dtlCd", dtlCd);
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/setting/verify_list";
    }

    @PostMapping("/vrfc/load")
    @ResponseBody
    public Map<String, Object> verifyView(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        Map<String, Object> result = new HashMap<String, Object>();
        if ("M".equals(StringUtil.getString(params.get("type")))) {
            result.put("data", verifyService.getVerifyMaster(params));
        } else {
            result.put("data", verifyService.getVerifyDetail(params));
        }
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/vrfc/master")
    @ResponseBody
    public Map<String, Object> verifyMasterList(@RequestBody Map<String, Object> params) {
        List<Map<String, Object>> list = verifyService.getVerifyMasterList(params);
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("grp_cd", "");
        map.put("grp_cd_nm", "선택하세요");
        list.add(0, map);
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("data", list);
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/vrfc/register/detail")
    @ResponseBody
    public Map<String, Object> saveVerifyDetail(@RequestBody Verify verify, HttpServletRequest request) {

        log.info(verify.toString());

        verify.setLoginUserSeq(getSessionLoginUserSeq(request));
        verify.setLoginUserIp(getClientIP(request));

        verifyService.saveVerifyDetail(verify);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/vrfc/delete")
    @ResponseBody
    public Map<String, Object> deleteVerifyMaster(@RequestBody Verify verify, HttpServletRequest request) {
        verify.setLoginUserSeq(getSessionLoginUserSeq(request));
        verify.setLoginUserIp(getClientIP(request));

        verifyService.deleteVerifyDetail(verify);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }
}
