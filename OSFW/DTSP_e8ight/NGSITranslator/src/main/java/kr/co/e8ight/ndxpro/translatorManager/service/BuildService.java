package kr.co.e8ight.ndxpro.translatorManager.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorCompileRequestDto;
import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorRegisterDto;
import kr.co.e8ight.ndxpro.translatorManager.dto.ProcessResultDto;
import kr.co.e8ight.ndxpro.translatorManager.exception.CompileFailedException;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class BuildService {

    private final RestTemplate restTemplate;

    @Value("${translator-builder.url}")
    private String translatorBuilderUrl;

    public ResponseEntity<ProcessResultDto> build(TranslatorRegisterDto translatorRegisterDto, String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + token);

            HttpEntity<TranslatorRegisterDto> request = new HttpEntity(translatorRegisterDto, headers);

            ResponseEntity<ProcessResultDto> responseEntity = restTemplate.postForEntity(
                    translatorBuilderUrl + "/build",
                    request,
                    ProcessResultDto.class);
            if (responseEntity.getBody() == null) {
                throw new CompileFailedException(ErrorCode.INTERNAL_SERVER_ERROR, "build response body is null");
            }
            return responseEntity;
        } catch (RestClientException e) {
            throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, "Translator Builder server connection error. | " + e.getMessage());
        }
    }

    public ResponseEntity<ProcessResultDto> compile(TranslatorCompileRequestDto translatorCompileRequestDto, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setAccept(List.of(MediaType.ALL));

        HttpEntity<TranslatorCompileRequestDto> request = new HttpEntity(translatorCompileRequestDto, headers);

        ResponseEntity<ProcessResultDto> responseEntity = restTemplate.postForEntity(translatorBuilderUrl +"/compile",
                request, ProcessResultDto.class);

        if ( responseEntity.getBody() == null ) {
            throw new CompileFailedException(ErrorCode.INTERNAL_SERVER_ERROR, "compile response is null");
        }
        return responseEntity;
    }
}
