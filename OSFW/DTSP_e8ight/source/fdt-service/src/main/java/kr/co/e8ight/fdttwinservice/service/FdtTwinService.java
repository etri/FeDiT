package kr.co.e8ight.fdttwinservice.service;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import kr.co.e8ight.fdttwinservice.dto.FdtTwinDto;
import kr.co.e8ight.fdttwinservice.dto.FdtTwinResponseDto;
import kr.co.e8ight.fdttwinservice.util.ValidateUtil;
import kr.co.e8ight.fdttwinservice.util.exception.FdtTwinException;
import kr.co.e8ight.ndxpro.common.config.ObjectMapperConfig;
import kr.co.e8ight.ndxpro.common.config.RestTemplateConfig;
import kr.co.e8ight.ndxpro.common.domain.Entity;
import kr.co.e8ight.ndxpro.common.domain.Property;
import kr.co.e8ight.ndxpro.common.domain.Relationship;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
@Slf4j
public class FdtTwinService {

    RestTemplate restTemplate = RestTemplateConfig.getInstance();
    ObjectMapper objectMapper = ObjectMapperConfig.getInstance();

    @Value("${broker.url}")
    private String brokerUrl;

    @Value("${context.url}")
    private String context;

    @Value("${token}")
    private String token;

    public FdtTwinResponseDto getTouristFdtData(
            String measurePositionId, String federatedDigitalObjectId)
            throws JsonProcessingException {

        String fdtTwinEntityId = "urn:ngsi-ld:FdtPoc:" + federatedDigitalObjectId;
        URI uri = UriComponentsBuilder
                .fromUriString(brokerUrl)
                .path("/ndxpro/v1/broker/entities/" + fdtTwinEntityId)
                .build()
                .toUri();

        HttpHeaders header = createHeader();
        log.info("Requesting to " + uri.getHost()+":"+ uri.getPort() + uri.getPath());
        ResponseEntity<String> response = requestWithGetMethod(uri, header);

        if (ValidateUtil.isEmptyData(response)) {
            throw new FdtTwinException(ErrorCode.RESOURCE_NOT_FOUND,
                    "FederatedDigitalObject not found. " + federatedDigitalObjectId);
        }

        Entity entity = objectMapper.readValue(response.getBody(), Entity.class);

        Property name = entity.getProperty("name");
        String value = name.getValue().toString();

        Relationship relationship = entity.getRelationship("hasTwin");
        List<String> objects = relationship.getObject();

        List<Object> dataset = new ArrayList<>();
        getSingleTwinData(objects, header, dataset);

        FdtTwinDto fdtTwinDto = FdtTwinDto.builder()
                .federated_digital_object_id(federatedDigitalObjectId)
                .dataset(dataset)
                .build();

        FdtTwinResponseDto fdtTwinResponseDto = FdtTwinResponseDto.builder()
                .measure_position_name(value)
                .federation_data(fdtTwinDto)
                .build();

        return fdtTwinResponseDto;
    }

    private ResponseEntity<String> requestWithGetMethod(URI uri, HttpHeaders header) {

        try {
            RequestEntity<Void> request = RequestEntity
                    .get(uri)
                    .headers(header)
                    .build();
            ResponseEntity<String> exchange = restTemplate.exchange(request, String.class);
            return exchange;

        } catch (HttpClientErrorException e) {
            // 4xx 클라이언트 오류 처리
            throw new FdtTwinException(ErrorCode.OPERATION_NOT_SUPPORTED, "Client error: " + e.getStatusCode());
        } catch (HttpServerErrorException e) {
            // 5xx 서버 오류 처리
            throw new FdtTwinException(ErrorCode.INTERNAL_SERVER_ERROR, "Server error: " + e.getStatusCode());
        } catch (RestClientException e) {
            // 기타 RestTemplate 관련 예외 처리
            throw new FdtTwinException(ErrorCode.INTERNAL_SERVER_ERROR, "Rest client error: " + e.getMessage());
        }


    }


    private void getSingleTwinData(List<String> objects, HttpHeaders header,
            List<Object> dataset) throws JsonProcessingException {

        for (String singleTwinEntityId : objects) {
            URI uri = UriComponentsBuilder
                    .fromUriString(brokerUrl)
                    .path("/ndxpro/v1/broker/entities/" + singleTwinEntityId)
                    .build()
                    .toUri();

            log.info("Requesting to " + uri.getHost()+":"+ uri.getPort() + uri.getPath());
            ResponseEntity<String> response = requestWithGetMethod(uri, header);

            if (ValidateUtil.isEmptyData(response)) {
                throw new FdtTwinException(ErrorCode.RESOURCE_NOT_FOUND,
                        "SingleTwin not found. " + singleTwinEntityId);
            }
            Entity entity = objectMapper.readValue(response.getBody(), Entity.class);
            dataset.add(entity);
        }

    }

    private HttpHeaders createHeader() {
        HttpHeaders header = new HttpHeaders();
        header.set("Link", "<"+context+">;");
        header.set("Authorization" , "Bearer " + token);
        return header;
    }

}
