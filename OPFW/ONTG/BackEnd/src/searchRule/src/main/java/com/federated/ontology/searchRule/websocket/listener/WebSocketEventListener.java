package com.federated.ontology.searchRule.websocket.listener;

import com.federated.ontology.searchRule.websocket.dto.ResponseStatus;
import com.federated.ontology.searchRule.websocket.service.DigitalTwinService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

@Component
public class WebSocketEventListener {
    private final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private DigitalTwinService digitalTwinService;

    private MessageHeaders createHeaders(String sessionId) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headerAccessor.setSessionId(sessionId);
        headerAccessor.setLeaveMutable(true);
        return headerAccessor.getMessageHeaders();
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        logger.info("New WebSocket connection established: {}", sessionId);
    }

    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String destination = headerAccessor.getDestination();

        logger.info("Session {} subscribed to {}", sessionId, destination);

        if ("/user/queue/status".equals(destination)) {
            boolean isOnline = digitalTwinService.checkStatus();
            ResponseStatus status = new ResponseStatus(
                    isOnline ? "ONLINE" : "OFFLINE",
                    isOnline ? "디지털 트윈 연결됨" : "서버 점검 중입니다"
            );

            assert sessionId != null;
            messagingTemplate.convertAndSendToUser(
                    sessionId,
                    "/queue/status",
                    status,
                    createHeaders(sessionId)
            );
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        logger.info("WebSocket connection closed: {}", sessionId);
    }
}