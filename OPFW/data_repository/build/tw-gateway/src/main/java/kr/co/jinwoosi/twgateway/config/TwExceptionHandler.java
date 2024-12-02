package kr.co.jinwoosi.twgateway.config;

import lombok.AllArgsConstructor;
import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.boot.autoconfigure.web.reactive.error.AbstractErrorWebExceptionHandler;
import org.springframework.boot.web.reactive.error.ErrorAttributes;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Order(-2)
@Component
public class TwExceptionHandler extends AbstractErrorWebExceptionHandler {
    private final TwRoutesLocator twRoutesLocator;
    public TwExceptionHandler(ErrorAttributes errorAttributes, WebProperties webProperties,
                              ApplicationContext applicationContext, ServerCodecConfigurer serverCodecConfigurer, TwRoutesLocator twRoutesLocator) {
        super(errorAttributes, webProperties.getResources(), applicationContext);
        this.twRoutesLocator = twRoutesLocator;
        setMessageReaders(serverCodecConfigurer.getReaders());
        setMessageWriters(serverCodecConfigurer.getWriters());
    }

    @Override
    protected RouterFunction<ServerResponse> getRoutingFunction(ErrorAttributes errorAttributes) {
        return RouterFunctions.route(this::checkRouteError, this::handleGatewayError);
    }

    private boolean checkRouteError(ServerRequest request) {
        return false;
    }

    public Mono<ServerResponse> handleGatewayError(ServerRequest request) {
        ServerResponse.BodyBuilder builder = ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR);
        // ... additional builder calls
        return builder.build();
    }

}