package kr.co.e8ight.ndxpro.databroker.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.domain.datamanager.AttributeResponseDto;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;

@Slf4j
@Component
public class AttributeCacheService {

    private final RestTemplate restTemplate;

    @Value("${datamanager.url}")
    private String dataManagerURL;

    @Value("${datamanager.api-path.attributes}")
    private String dataManagerGetAttributeAPI;

    public AttributeCacheService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Cacheable(key = "{#attributeId}", value = "attribute")
    public AttributeResponseDto getAttribute(String attributeId) {
        log.debug("getAttribute attributeId={}", attributeId);

        MultiValueMap<String, String> headerMap = new LinkedMultiValueMap<>();
        headerMap.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        headerMap.set(HttpHeaders.ACCEPT, MediaType.ALL_VALUE);

        RequestEntity<Void> requestEntity = new RequestEntity<>(headerMap, HttpMethod.GET, URI.create(dataManagerURL + dataManagerGetAttributeAPI + "/" + attributeId));

        ResponseEntity<AttributeResponseDto> responseEntity;
        try {

            responseEntity = restTemplate.exchange(requestEntity, AttributeResponseDto.class);
        } catch (RestClientException e) {
            throw new DataBrokerException(ErrorCode.INTERNAL_SERVER_ERROR, "Retrieve AttributeResponseDto error. "
                    + "message=" + e.getMessage() + ", attributeId=" + attributeId);
        }
        return responseEntity.getBody();
    }
}
