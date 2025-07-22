package com.stoneitgt.dt.data.platform.admin.controller;

import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.domain.LoginForm;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

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
        return "redirect:/dt/history/dashboard?menuCd=M0501";
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

