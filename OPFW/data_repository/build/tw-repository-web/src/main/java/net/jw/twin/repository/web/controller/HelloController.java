package net.jw.twin.repository.web.controller;

import net.jw.twin.repository.db.restKey.model.RestKey;
import net.jw.twin.repository.web.service.HelloWorldService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertiesPropertySource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Properties;

@RestController
public class HelloController {

    private final HelloWorldService helloWorldService;

    @Value("${build.date}")
    private String buildDate;

    @Autowired
    private ConfigurableEnvironment env;

    @Autowired
    public HelloController(HelloWorldService helloWorldService) {
        this.helloWorldService = helloWorldService;
    }

    @GetMapping("/test/build-date")
    public String buildDate() {
        return buildDate;
    }

    @GetMapping("/test/refresh/properties")
    public String refresh_properties() throws IOException {
        ClassPathResource resource = new ClassPathResource("config/properties/globals-build.properties");
        String content = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);

        Properties props = new Properties();
        props.load(new StringReader(content));

        String newBuildDate = props.getProperty("build.date");
        if (newBuildDate != null && !newBuildDate.equals(env.getProperty("build.date"))) {
            env.getPropertySources().replace("class path resource [config/properties/globals-build.properties]",
                    new PropertiesPropertySource("class path resource [config/properties/globals-build.properties]", props));
            System.out.println("Updated build.date: " + newBuildDate);
        }

        return "OK";
    }

    @RequestMapping(value = "/test", method = RequestMethod.GET)
    public RestKey test() {

        RestKey restKey = RestKey.builder()
                .id(1L)
                .issueTime(LocalDateTime.now())
                .build();

        return restKey;
    }

    @RequestMapping(value = "/test/test", method = RequestMethod.GET)
    public RestKey testtest() {

        RestKey restKey = RestKey.builder()
                .id(2L)
                .issueTime(LocalDateTime.now())
                .build();

        return restKey;
    }

    @RequestMapping(value = "/test/testString", method = RequestMethod.POST)
    public LocalDateTime testString(@RequestParam("localDateTime") LocalDateTime localDateTime) {

        return localDateTime;
    }

    @RequestMapping(value = "/test/testJson", method = RequestMethod.POST)
    public RestKey testJson(@RequestBody RestKey restKey) {

        RestKey ret = RestKey.builder()
                .id(1L)
                .issueTime(restKey.getIssueTime())
                .build();

        return ret;
    }
}
