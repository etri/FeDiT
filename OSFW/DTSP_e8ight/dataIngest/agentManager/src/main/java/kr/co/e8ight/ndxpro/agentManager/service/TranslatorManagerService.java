package kr.co.e8ight.ndxpro.agentManager.service;

import kr.co.e8ight.ndxpro.agentManager.domain.dto.OperationRequestDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.TranslatorListResponseDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.TranslatorResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Objects;

@Service
@Slf4j
@RequiredArgsConstructor
public class TranslatorManagerService {

    private final RestTemplate restTemplate;

    @Value("${translator-manager.url}")
    private String translatorManagerUrl;

    public boolean existByAgentId(Long agentId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4IiwiYXV0aCI6IkFETUlOIiwiZXhwIjoxNzA2MzMwMDE1fQ.zIKioGZVchXB2UYQcTyet_FywLhYq4MbodMWyuNSiOMz6ScOKDwHbJELz2VNN5KubgOgRVKVE5sOUcAPFJnqRg");

        HttpEntity request = new HttpEntity(headers);

        ResponseEntity<TranslatorListResponseDto> responseEntity = restTemplate.exchange(translatorManagerUrl + "/translators?agentId=" + agentId, HttpMethod.GET, request, TranslatorListResponseDto.class);

        if ( Objects.requireNonNull(responseEntity.getBody()).getTranslatorList().size() != 0 ) {
            return true;
        } else {
            return false;
        }
    }

    public void operateAllByAgentId(Long agentId, String operation) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4IiwiYXV0aCI6IkFETUlOIiwiZXhwIjoxNzA2MzMwMDE1fQ.zIKioGZVchXB2UYQcTyet_FywLhYq4MbodMWyuNSiOMz6ScOKDwHbJELz2VNN5KubgOgRVKVE5sOUcAPFJnqRg");

        HttpEntity request = new HttpEntity(headers);
        ResponseEntity<TranslatorListResponseDto> responseEntity = restTemplate.exchange(translatorManagerUrl + "/translators?agentId=" + agentId, HttpMethod.GET, request, TranslatorListResponseDto.class);

        OperationRequestDto requestDto = new OperationRequestDto(operation);
        HttpEntity<OperationRequestDto> operationRequest = new HttpEntity<>(requestDto, headers);

        StringBuilder ids = new StringBuilder();
        for (TranslatorResponseDto translatorResponseDto : responseEntity.getBody().getTranslatorList()) {
            Long translatorId = translatorResponseDto.getId();
            ids.append(translatorId).append(",");
            restTemplate.exchange(translatorManagerUrl + "/translators/" + translatorId, HttpMethod.PATCH, operationRequest, TranslatorListResponseDto.class);
        }
        log.info("translator id " + ids + " operation : " + operation + " triggered.");
    }
}
