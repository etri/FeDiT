package com.federated.ontology.searchRule.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<Map<String, Object>> handleHttpClientError(HttpClientErrorException e) {
        log.warn("HTTP client error: {} {}", e.getStatusCode(), e.getMessage());
        return buildResponse(e.getStatusCode().value(), e.getStatusText(), e.getMessage());
    }

    @ExceptionHandler(HttpServerErrorException.class)
    public ResponseEntity<Map<String, Object>> handleHttpServerError(HttpServerErrorException e) {
        log.error("HTTP server error: {} {}", e.getStatusCode(), e.getMessage());
        return buildResponse(e.getStatusCode().value(), e.getStatusText(), e.getMessage());
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<Map<String, Object>> handleResourceAccess(ResourceAccessException e) {
        log.error("External service unreachable: {}", e.getMessage());
        return buildResponse(HttpStatus.SERVICE_UNAVAILABLE.value(), "Service Unavailable", e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException e) {
        log.warn("Bad request: {}", e.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST.value(), "Bad Request", e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception e) {
        log.error("Unhandled exception", e);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal Server Error", e.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(int status, String error, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status);
        body.put("error", error);
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
