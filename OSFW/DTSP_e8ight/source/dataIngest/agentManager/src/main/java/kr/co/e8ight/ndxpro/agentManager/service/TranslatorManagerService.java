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

    // 서비스 간 호출용 토큰. 값은 환경변수 INTERNAL_API_TOKEN(또는 로컬 설정)으로 주입한다.
    @Value("${internal-api.token:}")
    private String internalApiToken;

    @Value("${translator-manager.url}")
    private String translatorManagerUrl;

    public boolean existByAgentId(Long agentId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + internalApiToken);

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
