package kr.co.e8ight.ndxpro_gateway.filter;


import io.jsonwebtoken.Claims;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_gateway.exception.AuthorizationException;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import kr.co.e8ight.ndxpro_gateway.util.JwtUtil;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Component
public class JwtAuthenticationGatewayFilterFactory extends AbstractGatewayFilterFactory<JwtAuthenticationGatewayFilterFactory.Config> {
    public static final String BEARER_PREFIX = "Bearer ";

    public final String AUTHORIZATION_SERVICE ="/ndxpro/v1/auth/";
    public final String DATAMANAGER_SERVICE ="/ndxpro/v1/manager/";
    public final String DATAINGEST_SERVICE ="/ndxpro/v1/ingest/";
    public final String NGSI_TRANSLATOR_SERVICE ="/ndxpro/v1/translator/";
    public final String TRANSLATOR_BUILDER_SERVICE ="/ndxpro/v1/translator-builder/";
    public final String DATABROKER_SERVICE ="/ndxpro/v1/broker/";
    public final String DATASERVICE_SERVICE ="/ndxpro/v1/service/";
    public final String DATAPREDICTION_SERVICE ="/ndxpro/v1/prediction/";

    private JwtUtil jwtUtil;

    public JwtAuthenticationGatewayFilterFactory(JwtUtil jwtUtil){super(Config.class);
        this.jwtUtil = jwtUtil;
    }

    @Override
    public GatewayFilter apply(Config config) {
        log.info("JwtAuthentication");

        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            ServerHttpResponse response = exchange.getResponse();

            if (request.getPath().value().equals("/ndxpro/v1/auth/login") ||
                    request.getPath().value().equals("/ndxpro/v1/auth/signup") ||
                    request.getPath().value().equals("/ndxpro/v1/auth/reAccessToken")
            ) {
                return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                    if (config.isPostLogger()) {
                        log.info("Global Filter End: response code -> {}", response.getStatusCode());
                    }
                }));

            }

            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                throw new AuthorizationException(ErrorCode.UNAUTHORIZED, "No authorization header");
            }

            if (this.isAuthMissing(request))
                throw new AuthorizationException(ErrorCode.UNAUTHORIZED, "Authorization header is missing in request");

            final String token = this.getAuthHeader(request);

            if (!jwtUtil.validateToken(token))
                throw new AuthorizationException(ErrorCode.UNAUTHORIZED, "Authorization header is invalid.");


            this.populateRequestWithHeaders(exchange, token);

//            메뉴접근 권한 확인
            if (!checkAuthorization(request)){
                throw new AuthorizationException(ErrorCode.UNAUTHORIZED, "No service access.");
            }

            return chain.filter(exchange);
        };
    }

    private Boolean checkAuthorization(ServerHttpRequest request){
        List<String> roles = Optional.of(request.getHeaders().get("role"))
                .orElseThrow(()->new AuthorizationException(ErrorCode.UNAUTHORIZED, "No role."));

        String appPath= Optional.of(request.getPath().pathWithinApplication().toString())
                .orElseThrow(()-> new AuthorizationException(ErrorCode.UNAUTHORIZED, "No appPath."));

        for (String role: roles){
            switch (role){
                case "ADMIN":
                case "USER":
                    return Boolean.TRUE;
                case "DM":
                    if (appPath.contains(DATAMANAGER_SERVICE))
                        return Boolean.TRUE;
                    break;

            }
        }

        return Boolean.FALSE;
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        log.error(err);
        return response.setComplete();
    }

    private String getAuthHeader(ServerHttpRequest request) {
        String authorizationHeader =  Objects.requireNonNull(request.getHeaders().get(HttpHeaders.AUTHORIZATION)).get(0);
        return authorizationHeader.replace(BEARER_PREFIX, "");
    }

    private boolean isAuthMissing(ServerHttpRequest request) {
        String bearerToken = this.getAuthHeader(request);
        return !StringUtils.hasText(bearerToken);
    }

    private void populateRequestWithHeaders(ServerWebExchange exchange, String token) {
        Claims claims = jwtUtil.getAllClaimsFromToken(token);
        log.info("id={} , auth={}", String.valueOf(claims.get("sub")), String.valueOf(claims.get("auth")));

        exchange.getRequest().mutate()
                .header("id", String.valueOf(claims.get("sub")))
                .header("role", String.valueOf(claims.get("auth")))
                .build();
    }


    public static class Config {
        private String baseMessage;
        private boolean preLogger;
        private boolean postLogger;

        public String getBaseMessage() {
            return baseMessage;
        }

        public void setBaseMessage(String baseMessage) {
            this.baseMessage = baseMessage;
        }

        public boolean isPreLogger() {
            return preLogger;
        }

        public void setPreLogger(boolean preLogger) {
            this.preLogger = preLogger;
        }

        public boolean isPostLogger() {
            return postLogger;
        }

        public void setPostLogger(boolean postLogger) {
            this.postLogger = postLogger;
        }

        @Override
        public String toString() {
            return "Config{" +
                    "baseMessage='" + baseMessage + '\'' +
                    ", preLogger=" + preLogger +
                    ", postLogger=" + postLogger +
                    '}';
        }
    }
}
