package kr.co.e8ight.ndxpro.dataservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.dataservice.dto.*;
import kr.co.e8ight.ndxpro.dataservice.exception.DataServiceException;
import kr.co.e8ight.ndxpro.dataservice.util.HttpHeadersUtil;
import kr.co.e8ight.ndxpro.dataservice.util.ValidateUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.annotation.PostConstruct;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class IoTEntityService {

    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper;

    @Value("${databroker.url}")
    private String dataBrokerURL;

    @Value("${databroker.api-path}")
    private String dataBrokerAPIPath;

    private String dataBrokerFullURL;

    public IoTEntityService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void setDataBrokerFullURL() {
        dataBrokerFullURL = dataBrokerURL + dataBrokerAPIPath + "/iot";
    }

    public Object getIoTEntity(String entityId, String context) {

        MultiValueMap<String, String> headerMap = new LinkedMultiValueMap<>();
        headerMap.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        headerMap.set(HttpHeaders.ACCEPT, MediaType.ALL_VALUE);
        headerMap.set(HttpHeaders.LINK, context);
        headerMap.set("Authorization", "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4IiwiYXV0aCI6IkFETUlOIiwiZXhwIjoxNzA2MzMwMDE1fQ.zIKioGZVchXB2UYQcTyet_FywLhYq4MbodMWyuNSiOMz6ScOKDwHbJELz2VNN5KubgOgRVKVE5sOUcAPFJnqRg");

        RequestEntity<Void> requestEntity;
        try {
            requestEntity = new RequestEntity<>(
                    headerMap,
                    HttpMethod.GET,
                    URI.create(dataBrokerFullURL + "/provider/" + URLEncoder.encode(entityId, "UTF-8"))
            );
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }

        ResponseEntity<Object> responseEntity;
        try {
            // contextURI 에 요청 후 String 타입으로 response 반환
            responseEntity = restTemplate.exchange(requestEntity, Object.class);
        } catch (RestClientException e) {
            throw new DataServiceException(parseRestClientExceptionErrorMessage(e), "Retrieve IoT Entity error. "
                    + "message=" + e.getMessage() + ", entityId=" + entityId + ", context=" + context);
        }

        return responseEntity.getBody();
    }

    public DataModelEntityDto getIoTEntities(int offset, int limit, String sort, String sortproperty, String type, String q, String context) {

        MultiValueMap<String, String> headerMap = new LinkedMultiValueMap<>();
        headerMap.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        headerMap.set(HttpHeaders.ACCEPT, MediaType.ALL_VALUE);
        headerMap.set(HttpHeaders.LINK, context);
        headerMap.set("Authorization", "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4IiwiYXV0aCI6IkFETUlOIiwiZXhwIjoxNzA2MzMwMDE1fQ.zIKioGZVchXB2UYQcTyet_FywLhYq4MbodMWyuNSiOMz6ScOKDwHbJELz2VNN5KubgOgRVKVE5sOUcAPFJnqRg");

        String requestURL = null;
        try {
            requestURL = dataBrokerFullURL + "/provider"
                    + "?type=" + URLEncoder.encode(type, "UTF-8")
                    + "&offset=" + offset
                    + "&limit=" + limit
                    + "&sort=" + sort
                    + "&sortproperty=" + sortproperty
                    + "&options=count";
            if(!ValidateUtil.isEmptyData(q))
                requestURL += "&q=" + URLEncoder.encode(q, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }

        RequestEntity<Void> requestEntity = new RequestEntity<>(headerMap, HttpMethod.GET,
                    URI.create(requestURL));

        ResponseEntity<List> responseEntity;
        try {
            // contextURI 에 요청 후 String 타입으로 response 반환
            responseEntity = restTemplate.exchange(requestEntity, List.class);
        } catch (RestClientException e) {
            throw new DataServiceException(parseRestClientExceptionErrorMessage(e), "Retrieve IoT Entities error. "
                    + "message=" + e.getMessage() + ", type=" + type + ", q=" + q + ", context=" + context);
        }

        List<LinkedHashMap> entityList = responseEntity.getBody();

        List<EntityProviderDto> entityProviderDtoList = new ArrayList<>();
        entityList.stream().forEach((entity) -> {
            LinkedHashMap<String, Object> entityMap = (LinkedHashMap<String, Object>) entity.get("entity");
            entityProviderDtoList.add(EntityProviderDto.builder()
                            .provider(String.valueOf(entity.get("provider")))
                            .entityId(String.valueOf(entityMap.get("id")))
                            .build());
        });

        HttpHeaders responseHeader = responseEntity.getHeaders();

        return DataModelEntityDto.builder()
                .model(type)
                .context(HttpHeadersUtil.parseLinkURI(context))
                .totalPage(Integer.parseInt(responseHeader.get("totalPage").get(0)))
                .totalData(Long.parseLong(responseHeader.get("totalData").get(0)))
                .entities(entityProviderDtoList)
                .build();
    }

    public IoTEntityHistoryIdListDto getEntityHistories(int offset, int limit, String sort, String sortproperty, String entityId, String timeproperty, String timerel, String time, String endTime, String q, String context) {
        MultiValueMap<String, String> headerMap = new LinkedMultiValueMap<>();
        headerMap.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        headerMap.set(HttpHeaders.ACCEPT, MediaType.ALL_VALUE);
        headerMap.set(HttpHeaders.LINK, context);
        headerMap.set("Authorization", "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4IiwiYXV0aCI6IkFETUlOIiwiZXhwIjoxNzA2MzMwMDE1fQ.zIKioGZVchXB2UYQcTyet_FywLhYq4MbodMWyuNSiOMz6ScOKDwHbJELz2VNN5KubgOgRVKVE5sOUcAPFJnqRg");

        String requestURL = null;
        try {
            requestURL = dataBrokerFullURL + "/history"
                    + "?entityId=" + URLEncoder.encode(entityId, "UTF-8")
                    + "&timeproperty=" + timeproperty
                    + "&offset=" + offset
                    + "&limit=" + limit
                    + "&sort=" + sort
                    + "&sortproperty=" + sortproperty
                    + "&options=count";

            if(!ValidateUtil.isEmptyData(q))
                requestURL += "&q=" + URLEncoder.encode(q, "UTF-8");

            if(!ValidateUtil.isEmptyData(timerel))
                requestURL += "&timerel=" + timerel;

            if(!ValidateUtil.isEmptyData(time))
                requestURL += "&time=" + time;

            if(!ValidateUtil.isEmptyData(endTime))
                requestURL += "&endTime=" + endTime;

        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }

        RequestEntity<Void> requestEntity = new RequestEntity<>(headerMap, HttpMethod.GET,
                URI.create(requestURL));

        ResponseEntity<List> responseEntity;
        try {
            // contextURI 에 요청 후 String 타입으로 response 반환
            responseEntity = restTemplate.exchange(requestEntity, List.class);
        } catch (RestClientException e) {
            throw new DataServiceException(parseRestClientExceptionErrorMessage(e), "Retrieve Entity Histories error. "
                    + "message=" + e.getMessage() + ", entityId=" + entityId + ", q=" + q + ", context=" + context);
        }

        List<LinkedHashMap> historyList = responseEntity.getBody();

        List<IoTEntityHistoryIdDto> entityHistoryIdDtoList = new ArrayList<>();
        historyList.stream().forEach((history) -> {
            IoTEntityHistoryIdDto entityHistoryDto = IoTEntityHistoryIdDto.builder()
                    .entityId(entityId)
                    .observedAt(String.valueOf(history.get("observedAt")))
                    .provider(String.valueOf(history.get("provider")))
                    .historyId(String.valueOf(history.get("historyId")))
                    .build();
                entityHistoryIdDtoList.add(entityHistoryDto);
        });

        HttpHeaders responseHeader = responseEntity.getHeaders();

        return IoTEntityHistoryIdListDto.builder()
                .context(HttpHeadersUtil.parseLinkURI(context))
                .timeproperty(timeproperty)
                .totalPage(Integer.parseInt(responseHeader.get("totalPage").get(0)))
                .totalData(Long.parseLong(responseHeader.get("totalData").get(0)))
                .entityHistoryDtoList(entityHistoryIdDtoList)
                .build();
    }

    public IoTEntityHistoryDto getEntityHistory(String historyId, String timeproperty) {
        MultiValueMap<String, String> headerMap = new LinkedMultiValueMap<>();
        headerMap.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        headerMap.set(HttpHeaders.ACCEPT, MediaType.ALL_VALUE);
        headerMap.set("Authorization", "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4IiwiYXV0aCI6IkFETUlOIiwiZXhwIjoxNzA2MzMwMDE1fQ.zIKioGZVchXB2UYQcTyet_FywLhYq4MbodMWyuNSiOMz6ScOKDwHbJELz2VNN5KubgOgRVKVE5sOUcAPFJnqRg");

        RequestEntity<Void> requestEntity = new RequestEntity<>(headerMap, HttpMethod.GET,
                URI.create(dataBrokerFullURL + "/history/" + historyId
                        + "?timeproperty=" + timeproperty));


        ResponseEntity<LinkedHashMap> responseEntity;
        try {
            // contextURI 에 요청 후 String 타입으로 response 반환
            responseEntity = restTemplate.exchange(requestEntity, LinkedHashMap.class);
        } catch (RestClientException e) {
            throw new DataServiceException(parseRestClientExceptionErrorMessage(e), "Retrieve Entity History error. "
                    + "message=" + e.getMessage() + ", historyId=" + historyId);
        }

        LinkedHashMap responseEntityBody = responseEntity.getBody();

        return IoTEntityHistoryDto.builder()
                .historyId(String.valueOf(responseEntityBody.get("historyId")))
                .provider(String.valueOf(responseEntityBody.get("provider")))
                .timeproperty(timeproperty)
                .observedAt(String.valueOf(responseEntityBody.get("observedAt")))
                .entity(responseEntityBody.get("entity"))
                .build();
    }

    public ErrorCode parseRestClientExceptionErrorMessage(RestClientException e) {
        int firstIndex = e.getMessage().indexOf("\"");
        int lastIndex = e.getMessage().lastIndexOf("\"");
        String errorMessage = e.getMessage().substring(firstIndex + 1, lastIndex);
        Map map;
        try {
            map = objectMapper.readValue(errorMessage, Map.class);
        } catch (JsonProcessingException ex) {
            throw new RuntimeException(ex);
        }
        return ErrorCode.getErrorCode(String.valueOf(map.get("title")));
    }
}
