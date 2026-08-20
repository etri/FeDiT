package kr.co.e8ight.fdttwinservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthyCheckController {

    @GetMapping(value = "/")
    public String healthyCheck() {

        return "OK";
    }

}
