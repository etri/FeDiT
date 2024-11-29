package kr.co.jinwoosi.twgateway.config;

import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.web.reactive.error.DefaultErrorAttributes;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;

import java.util.Arrays;
import java.util.Map;
import java.util.NoSuchElementException;

@Component
public class TwErrorAttributes extends DefaultErrorAttributes {
    @Override
    public Map<String, Object> getErrorAttributes(ServerRequest request, ErrorAttributeOptions options) {
        Throwable error = super.getError(request);
        Map<String, Object> map = super.getErrorAttributes(request, options);

        int statusCode = (int) map.get("status");
        HttpStatus status = getHttpStatusFromStatusCode(statusCode);

        map.put("message", populateMapWithErrorMessage(error, map, status));
        return map;
    }

    private HttpStatus getHttpStatusFromStatusCode(int statusCode) {
        return Arrays.stream(HttpStatus.values())
                .filter(v -> v.value() == statusCode)
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException(String.format("정의되지 않은 생태코드 : %d", statusCode)));
    }

    private String populateMapWithErrorMessage(Throwable error, Map<String, Object> map, HttpStatus status) {
        return isErrorCausedByNoRouteDefinitionFound(error, map) ?
                String.format("정의되지 않은 경로 : %s", map.get("path")) :
                trimStatusAndQuotesFromErrorMessage(error.getMessage(), status);
    }

    private boolean isErrorCausedByNoRouteDefinitionFound(Throwable error, Map<String, Object> map) {
        return map.containsKey("requestId") && error.getMessage().contains("404");
    }

    private String trimStatusAndQuotesFromErrorMessage(String errorMessage, HttpStatus status) {
        return errorMessage
                .replace(status.toString(), "")
                .replace("\"", "")
                .trim();
    }
}
