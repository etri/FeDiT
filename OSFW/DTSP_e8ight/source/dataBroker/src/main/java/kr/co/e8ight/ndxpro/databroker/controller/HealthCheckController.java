package kr.co.e8ight.ndxpro.databroker.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.databroker.config.SwaggerConfiguration;
import kr.co.e8ight.ndxpro.databroker.dto.HealthCheckDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/broker")
@Tag(name = SwaggerConfiguration.TAG_HEALTH_CHECK)
public class HealthCheckController {

    @Operation(summary = "서비스 상태 확인", method = "GET")
    @GetMapping("/healthcheck")
    public HealthCheckDto responseStatus() {
        return new HealthCheckDto("healthy");
    }
}
