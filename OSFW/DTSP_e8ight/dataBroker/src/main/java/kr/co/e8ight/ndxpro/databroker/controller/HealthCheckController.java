package kr.co.e8ight.ndxpro.databroker.controller;

import kr.co.e8ight.ndxpro.databroker.dto.HealthCheckDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/broker")
public class HealthCheckController {

    @GetMapping("/healthcheck")
    public HealthCheckDto responseStatus() {
        return new HealthCheckDto("healthy");
    }
}
