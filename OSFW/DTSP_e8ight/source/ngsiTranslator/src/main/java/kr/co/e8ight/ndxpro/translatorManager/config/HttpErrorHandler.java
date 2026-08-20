package kr.co.e8ight.ndxpro.translatorManager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.exception.BuildErrorResult;
import kr.co.e8ight.ndxpro.translatorManager.exception.CompileFailedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.ResponseErrorHandler;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;

@RequiredArgsConstructor
@Slf4j
public class HttpErrorHandler implements ResponseErrorHandler {

    /** 로그/예외 메시지에 남길 응답 본문 최대 길이 */
    private static final int MAX_BODY_LENGTH = 2000;

    private final ObjectMapper objectMapper;

    @Override
    public boolean hasError(ClientHttpResponse response) throws IOException {
        return response.getStatusCode().series() == HttpStatus.Series.CLIENT_ERROR ||
                response.getStatusCode().series() == HttpStatus.Series.SERVER_ERROR;
    }

    @Override
    public void handleError(URI url, HttpMethod method, ClientHttpResponse response) throws IOException {
        handle(response, method + " " + url);
    }

    @Override
    public void handleError(ClientHttpResponse response) throws IOException {
        handle(response, "unknown endpoint");
    }

    private void handle(ClientHttpResponse response, String endpoint) throws IOException {
        HttpStatus status = response.getStatusCode();
        String body = readBody(response);
        String detail = extractDetail(body);

        log.error("Upstream call failed. [{}] responded {} {}. body={}",
                endpoint, status.value(), status.getReasonPhrase(), StringUtils.defaultIfBlank(body, "<empty>"));

        throw new CompileFailedException(
                toErrorCode(status),
                String.format("[%s] %d %s - %s", endpoint, status.value(), status.getReasonPhrase(), detail));
    }

    /**
     * 상위 서비스의 응답 상태를 그에 대응하는 ErrorCode 로 옮긴다.
     * 매핑이 없는 상태는 기존 동작대로 4xx -> INVALID_REQUEST, 그 외 -> INTERNAL_SERVER_ERROR.
     */
    private ErrorCode toErrorCode(HttpStatus status) {
        switch (status) {
            case BAD_REQUEST:
                return ErrorCode.BAD_REQUEST_DATA;
            case UNAUTHORIZED:
            case FORBIDDEN:
                return ErrorCode.UNAUTHORIZED;
            case NOT_FOUND:
                return ErrorCode.RESOURCE_NOT_FOUND;
            case CONFLICT:
                return ErrorCode.ALREADY_EXISTS;
            case UNPROCESSABLE_ENTITY:
                return ErrorCode.OPERATION_NOT_SUPPORTED;
            case LENGTH_REQUIRED:
                return ErrorCode.LENGTH_REQUIRED;
            default:
                return status.series() == HttpStatus.Series.CLIENT_ERROR
                        ? ErrorCode.INVALID_REQUEST
                        : ErrorCode.INTERNAL_SERVER_ERROR;
        }
    }

    /**
     * 에러 본문에서 원인 메시지를 뽑는다. JSON 파싱이 실패하거나 원인 필드가 비어 있으면
     * 원문을 그대로 돌려줘서 원인이 통째로 사라지지 않게 한다.
     */
    private String extractDetail(String body) {
        if (StringUtils.isBlank(body)) {
            return "no response body";
        }
        try {
            String detail = objectMapper.readValue(body, BuildErrorResult.class).resolveDetail();
            return StringUtils.isNotBlank(detail) ? detail : truncate(body);
        } catch (IOException e) {
            log.debug("Failed to parse upstream error body as JSON.", e);
            return truncate(body);
        }
    }

    private String readBody(ClientHttpResponse response) {
        try {
            return StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.debug("Failed to read upstream error body.", e);
            return "";
        }
    }

    private String truncate(String body) {
        String trimmed = body.trim();
        return trimmed.length() <= MAX_BODY_LENGTH ? trimmed : trimmed.substring(0, MAX_BODY_LENGTH) + "...(truncated)";
    }
}
