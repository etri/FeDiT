package kr.co.jinwoosi.twgateway.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.jw.twin.repository.db.ext.restKeyExt.service.RestKeyServiceExt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class AuthPermissionFilter implements GlobalFilter, Ordered {
    private final RestKeyServiceExt restKeyService;
    private final ObjectMapper objectMapper;
    static private final String SERVICE_ID = "service_id";
    static private final String REST_KEY = "rest_key";

    @Value("${jcms.repository.key-check-path}")
    private String checkPath;

    public AuthPermissionFilter(RestKeyServiceExt restKeyService, ObjectMapper objectMapper) {
        this.restKeyService = restKeyService;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        if (!MediaType.APPLICATION_JSON.isCompatibleWith(request.getHeaders().getContentType())
                && !request.getHeaders().getAccept().contains(MediaType.APPLICATION_JSON)) {
            return chain.filter(exchange);
        }
        String svcId = getServiceId(exchange.getRequest().getPath().toString());
        if (svcId.endsWith("api")) return chain.filter(exchange);

        String restKey = request.getHeaders().getFirst("Authorization");
        if(restKey==null || restKey.isEmpty()) restKey = request.getQueryParams().getFirst("rest_key");
        log.info("restKey : " + restKey);
        if(checkRestKey(svcId, restKey)) return chain.filter(exchange);
        return sendError(exchange, "사용자 Key 값이 유효하지 않습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private boolean checkRestKey(String svcId, String key) {
        if (svcId == null || svcId.isEmpty()) return false;
        if (key == null || key.isEmpty()) return false;

        try {
            return restKeyService.validateUsageRequest(svcId, key) != null;
        } catch (Exception e) {
            log.error("failed to validate rest key. " + e);
            return false;
        }
    }
    private Mono<Void> sendError(ServerWebExchange exchange, String error, HttpStatus httpStatus) {
        exchange.getResponse().setStatusCode(httpStatus);
        HttpHeaders headers = exchange.getResponse().getHeaders();
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*"); // A 웹서버의 origin으로 변경
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "GET,POST,PUT,DELETE,OPTIONS");
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization");
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");

        byte[] bytes = error.getBytes(); //(StandardCharsets.UTF_8);
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private static String getServiceId(String path) {
        if(path==null || path.isEmpty()) return "";
        int start = path.indexOf('/')+1;
        if(start<1 || start+4 > path.length()) return "";
        int end = path.indexOf('/', start);
        if(end < start) end = path.length();
        return path.substring(start, end);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
