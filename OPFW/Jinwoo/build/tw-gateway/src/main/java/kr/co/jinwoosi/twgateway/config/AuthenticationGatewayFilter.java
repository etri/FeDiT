package kr.co.jinwoosi.twgateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class AuthenticationGatewayFilter extends AbstractGatewayFilterFactory<AuthenticationGatewayFilter.Config> {
    public AuthenticationGatewayFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader != null ) {
                return Mono.error(new RuntimeException("Missing or invalid Authorization header"));
            }

            try {
                // 요청 헤더에 사용자 정보 추가
                ServerHttpRequest modifiedRequest = request.mutate()
                        .header("X-Authenticated-User", "username")
                        .build();

                ServerWebExchange modifiedExchange = exchange.mutate().request(modifiedRequest).build();

                return chain.filter(modifiedExchange);

            } catch (Exception e) {
                return Mono.error(new RuntimeException("Invalid JWT token"));
            }
        };
    }

    public static class Config {
        // 필터 설정을 위한 구성 클래스
    }
}
