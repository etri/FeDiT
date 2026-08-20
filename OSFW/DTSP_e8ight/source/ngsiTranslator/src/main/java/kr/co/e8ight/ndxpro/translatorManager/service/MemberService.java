package kr.co.e8ight.ndxpro.translatorManager.service;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.dto.MemberResponseDto;
import kr.co.e8ight.ndxpro.translatorManager.exception.MemberServiceException;
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

        ResponseEntity<MemberResponseDto> responseEntity;
        try {
            responseEntity = restTemplate.exchange(uriComponents.toUri(), HttpMethod.GET, request, MemberResponseDto.class);
        } catch (BaseException e) {
            // 인증 서비스 호출 실패가 컴파일 실패로 보이지 않도록 회원 조회 예외로 바꿔 던진다.
            throw new MemberServiceException(e.errorCode, "Member information receive task fail. | " + e.getMessage());
        }

        if ( !responseEntity.getStatusCode().equals(HttpStatus.OK) ||
                responseEntity.getBody() == null ) {
            throw new MemberServiceException(ErrorCode.RESOURCE_NOT_FOUND,
                    "Member information receive task fail.");
        }
        return responseEntity.getBody().getMemberId();
    }
}