package net.jw.twin.tw_service_manager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springdoc.core.models.GroupedOpenApi;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.swagger.v3.oas.models.media.Schema;

import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
public class SpringDocConfig {

    private final ObjectMapper objectMapper;

    public SpringDocConfig(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Bean
    public GroupedOpenApi userApi() {
        return GroupedOpenApi.builder()
                .group("api")
                .addOpenApiCustomizer(openApiCustomizer())
                .build();
    }

    public OpenApiCustomizer openApiCustomizer() {
        return openApi -> {
            openApi.getComponents().getSchemas().forEach((name, schema) -> {
                Map<String, Schema> properties = schema.getProperties();
                if (properties != null) {
                    Map<String, Schema> newProperties = new LinkedHashMap<>();
                    properties.forEach((key, value) -> {
                        String snakeCase = camelToSnakeCase((String) key);
                        newProperties.put(snakeCase, value);
                    });
                    schema.setProperties(newProperties);
                }
            });
        };
    }

    private String camelToSnakeCase(String str) {
        return str.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }
}