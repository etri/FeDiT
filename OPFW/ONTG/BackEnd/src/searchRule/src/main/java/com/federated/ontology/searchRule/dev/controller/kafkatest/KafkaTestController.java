package com.federated.ontology.searchRule.dev.controller.kafkatest;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import org.springframework.context.annotation.Profile;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@RestController
@RequestMapping("/api/v1/dev/kafka-publisher")
@Profile("dev")
public class KafkaTestController {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topic.searchRule}")
    private String topic;

    public KafkaTestController(KafkaTemplate<String, String> kafkaTemplate,
                                ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/single-message")
    public Map<String, Object> sendSingle() throws Exception {
        String dtid = "KR-99-T" + randomSuffix();
        Map<String, Object> message = buildTestMessage(dtid, "테스트 디지털 트윈 (단건)", "create");
        String json = objectMapper.writeValueAsString(message);

        kafkaTemplate.send(topic, "test-single", json);
        log.info("[KafkaTest] 단건 전송 완료. topic={}", topic);

        return Map.of("status", "SENT", "count", 1, "topic", topic);
    }

    @PostMapping("/burst-messages")
    public Map<String, Object> sendBurst(@RequestBody(required = false) Map<String, Object> body) throws Exception {
        int count = body != null && body.get("count") instanceof Number n ? n.intValue() : 10;

        for (int i = 1; i <= count; i++) {
            String dtid = "KR-99-B" + randomSuffix();
            String name = "배치 테스트 트윈 #" + i;
            Map<String, Object> message = buildTestMessage(dtid, name, "create");
            String json = objectMapper.writeValueAsString(message);

            kafkaTemplate.send(topic, "test-burst-" + i, json);
        }

        log.info("[KafkaTest] 버스트 전송 완료. count={}, topic={}", count, topic);
        return Map.of("status", "SENT", "count", count, "topic", topic);
    }

    @PostMapping("/delete-event")
    public Map<String, Object> sendDelete(@RequestBody Map<String, Object> body) throws Exception {
        String dtid = (String) body.get("dtid");
        if (dtid == null || dtid.isBlank()) {
            throw new IllegalArgumentException("dtid is required");
        }
        Map<String, Object> message = buildTestMessage(dtid, null, "delete");
        String json = objectMapper.writeValueAsString(message);

        kafkaTemplate.send(topic, "test-delete", json);
        log.info("[KafkaTest] 삭제 전송 완료. dtid={}", dtid);

        return Map.of("status", "SENT", "action", "delete", "dtid", dtid);
    }

    @PostMapping("/custom-message")
    public Map<String, Object> sendCustom(@RequestBody Map<String, Object> message) throws Exception {
        String json = objectMapper.writeValueAsString(message);

        kafkaTemplate.send(topic, "test-custom", json);
        log.info("[KafkaTest] 커스텀 전송 완료. message={}", json);

        return Map.of("status", "SENT", "message", message);
    }

    private String randomSuffix() {
        long num = ThreadLocalRandom.current().nextLong(10000000000L);
        return String.format("%010d", num);
    }

    private Map<String, Object> buildTestMessage(String dtid, String name, String action) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("dtid", dtid);

        if (!"delete".equals(action)) {
            metadata.put("digital_twin_name", name);
            metadata.put("description", "카프카 배치 테스트용 디지털 트윈");
            metadata.put("owner", "test-owner");
            metadata.put("subjects", List.of("테스트", "배치"));
            metadata.put("keywords", List.of("kafka", "batch", "test"));
        }

        Map<String, Object> message = new LinkedHashMap<>();
        message.put("action", action);
        message.put("metadata", metadata);

        return message;
    }
}
