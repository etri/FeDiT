package kr.co.e8ight.ndxpro.translatorManager.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.dto.DataModelDto;
import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorRegisterDto;
import kr.co.e8ight.ndxpro.translatorManager.exception.CompileFailedException;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@Slf4j
@RequiredArgsConstructor
public class DataModelService {

    private final RestTemplate restTemplate;

    @Value("${data-manager.url}")
    private String dataManagerUrl;


    public DataModelDto getDataModel(String modelType, String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + token);

            UriComponents uriComponents = UriComponentsBuilder.fromUriString(dataManagerUrl)
                    .path("/data-models/" + modelType)
                    .build();
            HttpEntity<TranslatorRegisterDto> request = new HttpEntity(headers);

            ResponseEntity<DataModelDto> responseEntity = restTemplate.exchange(uriComponents.toUri(), HttpMethod.GET, request, DataModelDto.class);
            if (responseEntity.getBody() == null) {
                throw new CompileFailedException(ErrorCode.INTERNAL_SERVER_ERROR, "build response body is null");
            }
            return responseEntity.getBody();
        } catch (RestClientException e) {
            throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, "Translator Builder server connection error. | " + e.getMessage());
        }
    }
}
