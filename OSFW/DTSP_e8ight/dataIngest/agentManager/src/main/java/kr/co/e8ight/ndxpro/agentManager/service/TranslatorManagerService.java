package kr.co.e8ight.ndxpro.agentManager.service;

import java.util.List;
import java.util.Objects;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.TranslatorListResponseDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.TranslatorResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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


    public void deleteAllByAgentId(Long agentId, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity request = new HttpEntity(headers);

        ResponseEntity<TranslatorListResponseDto> responseEntity = restTemplate.exchange(translatorManagerUrl + "/translators?agentId=" + agentId, HttpMethod.GET, request, TranslatorListResponseDto.class);

        List<TranslatorResponseDto> translatorList = responseEntity.getBody().getTranslatorList();
        StringBuilder ids = new StringBuilder();
        for (TranslatorResponseDto translatorResponseDto : translatorList) {
            Long translatorId = translatorResponseDto.getId();
            ids.append(translatorId).append(",");
            restTemplate.exchange(translatorManagerUrl + "/translators/" + translatorId, HttpMethod.DELETE, request, TranslatorListResponseDto.class);
        }
        log.info("translator id " + ids + " operation : delete triggered.");
    }
}
