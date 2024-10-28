package kr.co.e8ight.ndxpro.databroker.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.domain.datamanager.DataModelResponseDto;
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
public class DataModelCacheService {

    private final RestTemplate restTemplate;

    @Value("${datamanager.url}")
    private String dataManagerURL;

    @Value("${datamanager.api-path.data-models}")
    private String dataManagerGetDataModelAPI;

    public DataModelCacheService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Cacheable(key = "{#dataModelId}", value = "dataModel")
    public DataModelResponseDto getDataModel(String dataModelId) {
        log.debug("getDataModel dataModelId={}", dataModelId);

        String[] splitedDataModelId = dataModelId.split(":");
        String type = splitedDataModelId[splitedDataModelId.length - 1];

        MultiValueMap<String, String> headerMap = new LinkedMultiValueMap<>();
        headerMap.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        headerMap.set(HttpHeaders.ACCEPT, MediaType.ALL_VALUE);

        RequestEntity<Void> requestEntity = new RequestEntity<>(headerMap, HttpMethod.GET, URI.create(dataManagerURL + dataManagerGetDataModelAPI + "/" + type));

        ResponseEntity<DataModelResponseDto> responseEntity;
        try {

            responseEntity = restTemplate.exchange(requestEntity, DataModelResponseDto.class);
        } catch (RestClientException e) {
            throw new DataBrokerException(ErrorCode.INTERNAL_SERVER_ERROR, "Retrieve DataModelResponseDto error. "
                    + "message=" + e.getMessage() + ", dataModelId=" + dataModelId + ", dataModelType=" + type);
        }
        return responseEntity.getBody();
    }
}
