package com.stoneitgt.dt.data.platform.admin.controller;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.domain.LoginForm;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
public class RootController extends BaseController {
    @RequestMapping(value = "/login", method = {RequestMethod.GET, RequestMethod.POST})
    public String login(@ModelAttribute LoginForm loginForm, Model model) {
        if (authenticationFacade.isAdmin()) {
            return "redirect:/main";
        }
        model.addAttribute("loginForm", loginForm);
        return "pages/login";
    }

    @GetMapping(value = {"/", "/admin"})
    public String index(Model model) {
        return "redirect:/main";
    }

    @GetMapping("/main")
    public String main(Model model) {
        return "redirect:/dt/board/notice/list?menuCd=M0401";
    }

    @RequestMapping(value = "/error", method = {RequestMethod.GET, RequestMethod.POST})
    public String error() {
        return "error/error";
    }

    @PostMapping("/session/extention")
    @ResponseBody
    public Map<String, Object> sessionExtention(HttpServletRequest request) {
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("session_time", request.getSession().getMaxInactiveInterval());
        return result;
    }
}

