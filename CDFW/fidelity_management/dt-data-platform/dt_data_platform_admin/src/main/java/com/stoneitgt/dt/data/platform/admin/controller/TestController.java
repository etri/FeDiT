package com.stoneitgt.dt.data.platform.admin.controller;

import com.stoneitgt.dt.data.platform.admin.service.DTModelApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

@Slf4j
@Controller
@RequestMapping("/test")
@RequiredArgsConstructor
public class TestController {
    private final DTModelApiService dtModelApiService;

    @GetMapping("/test")
    @ResponseBody
    public Map<String, Object> test() throws Exception {
        return null;
    }
}
