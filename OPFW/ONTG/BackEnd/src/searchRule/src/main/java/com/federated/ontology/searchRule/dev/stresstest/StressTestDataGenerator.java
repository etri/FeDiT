package com.federated.ontology.searchRule.dev.stresstest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.federated.ontology.searchRule.dto.kafkaDto.KafkaMessage;
import com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl.NgsiLdEntityBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
public class StressTestDataGenerator {

    private static final String[] SUBJECT_POOL = {"제조", "에너지", "환경", "물류", "관광"};
    private static final String[] KEYWORD_POOL = {"온도", "센서", "습도", "진동", "압력", "전력", "유량"};

    private final NgsiLdEntityBuilder entityBuilder;
    private final ObjectMapper objectMapper;

    public StressTestDataGenerator(NgsiLdEntityBuilder entityBuilder, ObjectMapper objectMapper) {
        this.entityBuilder = entityBuilder;
        this.objectMapper = objectMapper;
    }

    public String generatePrefix() {
        return "STRESS-" + UUID.randomUUID().toString().substring(0, 6);
    }

    public List<KafkaMessage> generateKafkaMessages(int count, String prefix) {
        List<KafkaMessage> messages = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String dtid = String.format("%s-%05d", prefix, i);
            Map<String, Object> metadata = buildMetadata(dtid, i);
            Map<String, Object> fullMessage = new LinkedHashMap<>(metadata);
            fullMessage.put("id", dtid);
            messages.add(new KafkaMessage("create", metadata, fullMessage, dtid, "DigitalTwin", null, null));
        }
        return messages;
    }

    public List<Map<String, Object>> generateTwinMetadata(int count, String prefix) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String dtid = String.format("%s-%05d", prefix, i);
            list.add(buildMetadata(dtid, i));
        }
        return list;
    }

    public String generateNgsiLdEntityJson(String dtid, int index) {
        Map<String, Object> metadata = buildMetadata(dtid, index);
        metadata.put("digital_twin_name", metadata.get("name"));
        Map<String, Object> entity = entityBuilder.buildDigitalTwinEntity(metadata, dtid);
        try {
            return objectMapper.writeValueAsString(entity);
        } catch (Exception e) {
            throw new RuntimeException("NGSI-LD JSON 직렬화 실패", e);
        }
    }

    public Map<String, Object> generateKafkaMessagePayload(String dtid, int index, String action) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("metaTypeModel", "DigitalTwin");
        metadata.put("metaModel", "SingleDigitalTwin");
        metadata.put("dtid", dtid);
        metadata.put("name", "스트레스 테스트 트윈 " + index);
        metadata.put("description", "스트레스 테스트용 디지털 트윈 #" + index);
        metadata.put("owner", "stress-tester");
        metadata.put("creationTime", java.time.OffsetDateTime.now().toString());
        metadata.put("modificationTime", java.time.OffsetDateTime.now().toString());
        metadata.put("subjects", List.of(SUBJECT_POOL[index % SUBJECT_POOL.length]));
        metadata.put("keywords", List.of(
                KEYWORD_POOL[index % KEYWORD_POOL.length],
                KEYWORD_POOL[(index + 1) % KEYWORD_POOL.length]
        ));
        metadata.put("countryCode", "KR");
        metadata.put("classificationTypeCode", "99");
        metadata.put("classificationCode", "T00000");

        Map<String, Object> message = new LinkedHashMap<>();
        message.put("metadata", metadata);
        message.put("action", action);
        message.put("upSetList", List.of());
        message.put("key", dtid);
        return message;
    }

    public List<String> generateDtids(int count, String prefix) {
        List<String> dtids = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            dtids.add(String.format("%s-%05d", prefix, i));
        }
        return dtids;
    }

    private Map<String, Object> buildMetadata(String dtid, int index) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("metaTypeModel", "DigitalTwin");
        metadata.put("metaModel", "SingleDigitalTwin");
        metadata.put("dtid", dtid);
        metadata.put("name", "스트레스 테스트 트윈 " + index);
        metadata.put("description", "스트레스 테스트용 더미 데이터 #" + index);
        metadata.put("owner", "stress-tester");
        metadata.put("creationTime", java.time.OffsetDateTime.now().toString());
        metadata.put("modificationTime", java.time.OffsetDateTime.now().toString());
        metadata.put("subjects", List.of(SUBJECT_POOL[index % SUBJECT_POOL.length]));
        metadata.put("keywords", List.of(
                KEYWORD_POOL[index % KEYWORD_POOL.length],
                KEYWORD_POOL[(index + 1) % KEYWORD_POOL.length]
        ));
        metadata.put("countryCode", "KR");
        metadata.put("classificationTypeCode", "99");
        metadata.put("classificationCode", "T00000");
        return metadata;
    }
}
