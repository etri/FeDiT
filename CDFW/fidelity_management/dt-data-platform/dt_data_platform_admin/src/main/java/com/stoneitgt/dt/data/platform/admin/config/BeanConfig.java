package com.stoneitgt.dt.data.platform.admin.config;

import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class BeanConfig {
    @Bean
    public RestTemplate bulkRestTemplate() {
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
        HttpClient httpClient = HttpClientBuilder.create()
                .setMaxConnTotal(50)   // 최대 전체 연결 수
                .setMaxConnPerRoute(10) // 호스트당 연결 수
                .build();
        factory.setHttpClient(httpClient);
        return new RestTemplate(factory);
    }
}
