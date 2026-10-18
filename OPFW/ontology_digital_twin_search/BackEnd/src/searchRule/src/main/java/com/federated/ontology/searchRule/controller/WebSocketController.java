package com.federated.ontology.searchRule.controller;

import com.federated.ontology.searchRule.websocket.dto.ChatHistory;
import com.federated.ontology.searchRule.websocket.dto.DigitalLocation;
import com.federated.ontology.searchRule.websocket.dto.DigitalTwin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import org.springframework.beans.factory.annotation.Value;

import java.time.OffsetDateTime;

@Controller
public class WebSocketController {
    private final Logger logger = LoggerFactory.getLogger(WebSocketController.class);

    @Value("${fedit.api.base-url}")
    private String feditBaseUrl;

    @MessageMapping("/question")
    @SendToUser("/queue/answer")
    public ChatHistory<DigitalTwin[]> handleQuestion(ChatHistory<String> message, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();

        DigitalTwin[] botResponse = processBotResponse(sessionId);

        return new ChatHistory<>(botResponse, "Bot", System.currentTimeMillis());
    }

    private DigitalTwin[] processBotResponse(String sessionId) {
        return mockDigitalTwinList(sessionId);
    }

    private DigitalTwin[] mockDigitalTwinList(String sessionId) {
        DigitalLocation location = new DigitalLocation();
        location.setType("MultiPoint");
        location.setCoordinates(new double[][]{{126.532371, 33.500116}});

        DigitalTwin digitalTwin = new DigitalTwin();
        digitalTwin.setDigitalTwinID("KR-02-N10000-20250001" + "-" + sessionId);
        digitalTwin.setDigitalTwinName("관광 디지털 트윈" + "-" + sessionId);
        digitalTwin.setDescription("제주도 관광지 소개 디지털 트윈" + "-" + sessionId);
        digitalTwin.setOwner("제주관광공사" + "-" + sessionId);
        digitalTwin.setKeywords(new String[]{"관광", "주차장", sessionId});
        digitalTwin.setCreationTime(OffsetDateTime.parse("2024-03-11T01:00:00.945Z"));
        digitalTwin.setCreatorID("keti");
        digitalTwin.setModificationTime(OffsetDateTime.parse("2024-03-03T20:00:00.000Z"));
        digitalTwin.setPointOfAccess(feditBaseUrl + "/fedit/v1/digital-twins/KR-02-N10000-20250001");
        digitalTwin.setContactPoint("064-740-6000~1");
        digitalTwin.setSubjects(new String[]{"관광"});
        digitalTwin.setLocation(location);
        digitalTwin.setMemberDigitalObjectsIDS(new String[]{"KR-109012-0001", "KR-109012-0002"});
        digitalTwin.setNumberOfDigitalObjects(32);
        digitalTwin.setNumberOfServices(0);
        digitalTwin.setNumberOfSimulations(1);

        return new DigitalTwin[]{digitalTwin};
    }
}