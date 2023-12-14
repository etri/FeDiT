package kr.co.e8ight.ndxpro.agentManager.service;

import kr.co.e8ight.ndxpro.agentManager.domain.dto.MemberResponseDto;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final RestTemplate restTemplate;

    @Value("${auth.url}")
    private String authServiceUrl;

    public String getMemberId(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity request = new HttpEntity(headers);

        UriComponents uriComponents = UriComponentsBuilder.fromUriString(authServiceUrl)
                .path("/getMemberByToken")
                .build();

        ResponseEntity<MemberResponseDto> responseEntity = restTemplate.exchange(uriComponents.toUri(), HttpMethod.GET, request, MemberResponseDto.class);

        if ( !responseEntity.getStatusCode().equals(HttpStatus.OK) ||
                responseEntity.getBody() == null ) {
            throw new AgentException(ErrorCode.RESOURCE_NOT_FOUND,
                    "Member information receive task fail.");
        }
        return responseEntity.getBody().getMemberId();
    }
}
