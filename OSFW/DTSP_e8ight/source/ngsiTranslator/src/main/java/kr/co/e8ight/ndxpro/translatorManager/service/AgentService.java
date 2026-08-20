package kr.co.e8ight.ndxpro.translatorManager.service;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
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
        headers.set("Authorization", token);

        HttpEntity request = new HttpEntity(headers);

        try {
            restTemplate.exchange(gatewayUrl + "/ndxpro/v1/ingest/agent/" + agentId, HttpMethod.GET, request, Object.class);
            return true;
        } catch (BaseException e) {
            // RestTemplate 는 404 에서 이미 예외를 던지므로 응답 상태를 비교하는 방식으로는
            // "없음"을 판별할 수 없다. 없는 것만 false 로 돌리고 나머지 오류는 그대로 올린다.
            if (ErrorCode.RESOURCE_NOT_FOUND.equals(e.errorCode)) {
                return false;
            }
            throw e;
        }
    }

    public String getTargetTopic(Long agentId, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity request = new HttpEntity(headers);

        ResponseEntity<AgentInfoResponseDto> responseEntity = restTemplate.exchange(gatewayUrl + "/ndxpro/v1/ingest/agent/" + agentId, HttpMethod.GET, request, AgentInfoResponseDto.class);
        return Objects.requireNonNull(responseEntity.getBody()).getTopic();
    }

    public void stop(Long agentId, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        OperationRequestDto requestBody = new OperationRequestDto("stop");
        HttpEntity<OperationRequestDto> request = new HttpEntity<>(requestBody, headers);

        restTemplate.exchange(gatewayUrl + "/ndxpro/v1/ingest/agents/" + agentId, HttpMethod.PATCH, request, Object.class);
    }
}
