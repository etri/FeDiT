package kr.co.n2m.platform.meta.architecture.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import lombok.extern.slf4j.Slf4j;

/**
 * Web Socket 설정
 * 
 * @author  n2m
 * 
 * 참고: https://dev-gorany.tistory.com/235, https://www.daddyprogrammer.org/post/4691/spring-websocket-chatting-server-stomp-server/
 */
@Slf4j
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
	
//	@Autowired
//	private AuthorizationChannelInterceptor authorizationChannelInterceptor;	
	
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
    	log.debug("registerStompEndpoints 시작...");
    	
    	// connection을 맺을때 CORS 허용
        registry.addEndpoint("/api/v1/portal/stomp")
//    		// 스프링 5.3, 스프링부트 2.4 버전 부터 allowCredentials이 true인 경우 setAllowedOrigins 메서드에서 
//    		// 와일드 카드 `'*'`을 사용하실 수 없습니다.
//    		//.setAllowedOrigins("*")
        	.setAllowedOriginPatterns("*")    	
	        .withSockJS();
        
        log.debug("registerStompEndpoints 종료");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
    	log.debug("configureMessageBroker 시작...");
    	
    	// 클라이언트가 메시지를 구독할 endpoint를 정의
    	config.enableSimpleBroker("/sub");
    	// 도착 경로 prefix 설정
    	config.setApplicationDestinationPrefixes("/pub");
        
        log.debug("MessageBrokerRegistry : {}", config);
        log.debug("configureMessageBroker 종료");
    }

//    @Override
//    public void configureClientInboundChannel(ChannelRegistration registration) {
//    	log.debug("configureClientInboundChannel 시작...");
//    	
////        registration.interceptors(authorizationChannelInterceptor);
//        
//        log.debug("configureClientInboundChannel 종료");
//    }

}
