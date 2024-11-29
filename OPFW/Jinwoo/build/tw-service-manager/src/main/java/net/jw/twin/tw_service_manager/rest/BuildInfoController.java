package net.jw.twin.tw_service_manager.rest;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BuildInfoController {

    @Value("${build.date}")
    private String buildDate;

    @Value("${build.version}")
    private String buildVersion;

    @GetMapping("/build-date")
    public String getBuildDate() {
        return buildDate;
    }

    @GetMapping("/build-version")
    public String getBuildVersion() {
        return buildVersion;
    }
}
