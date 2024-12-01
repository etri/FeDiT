package kr.co.e8ight.ndxpro.translatorManager.service;

import kr.co.e8ight.ndxpro.translatorManager.domain.AgentInfoResponseDto;
import kr.co.e8ight.ndxpro.translatorManager.dto.OperationRequestDto;
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
public class AgentService {

    private final RestTemplate restTemplate;

    @Value("${gateway.url}")
    private String gatewayUrl;

    public boolean exist(Long agentId, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        HttpEntity request = new HttpEntity(headers);

        ResponseEntity<?> responseEntity = restTemplate.exchange(gatewayUrl + "/ndxpro/v1/ingest/agent/" + agentId, HttpMethod.GET, request, Object.class);
        if ( responseEntity.getStatusCode().equals(HttpStatus.NOT_FOUND) ) {
            return false;
        } else {
            return true;
        }
    }

    public String getTargetTopic(Long agentId, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        HttpEntity request = new HttpEntity(headers);

        ResponseEntity<AgentInfoResponseDto> responseEntity = restTemplate.exchange(gatewayUrl + "/ndxpro/v1/ingest/agent/" + agentId, HttpMethod.GET, request, AgentInfoResponseDto.class);
        return Objects.requireNonNull(responseEntity.getBody()).getTopic();
    }

    public void stop(Long agentId, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        OperationRequestDto requestBody = new OperationRequestDto("stop");
        HttpEntity<OperationRequestDto> request = new HttpEntity<>(requestBody, headers);

        restTemplate.exchange(gatewayUrl + "/ndxpro/v1/ingest/agents/" + agentId, HttpMethod.PATCH, request, Object.class);
    }
}
