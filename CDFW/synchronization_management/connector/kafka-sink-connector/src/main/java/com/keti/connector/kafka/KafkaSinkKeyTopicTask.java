package com.keti.connector.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.keti.connector.kafka.config.KafkaProducerConfig;
import com.keti.connector.kafka.config.KafkaSinkKeyTopicConnectorConfig;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.errors.ConnectException;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.Arrays;
import java.util.List;

import java.util.HashMap;
import java.util.Map;

public class KafkaSinkKeyTopicTask extends SinkTask {
    private final static Logger log = LoggerFactory.getLogger(KafkaSinkKeyTopicTask.class);
    private KafkaProducer<String, String> producer;
    private String sinkTopic;
    private String connectorName;
    private String filteringCondition;

    private boolean timestampParsingEnabled;
    private String timestampParsingField;
    private String timestampFormat;

    private boolean keyParsingEnabled;
    private String keyParsingField;
    private String sourceTopicType;

    @Override
    public String version() {
        return "1.0";
    }

    @Override
    public void start(Map<String, String> props) {
        try {
            log.info("Task config setting : " + props.toString());
            KafkaSinkKeyTopicConnectorConfig config;
            connectorName = props.get("name");
            config = new KafkaSinkKeyTopicConnectorConfig(props);
            sourceTopicType = config.getString(config.SOURCE_TOPIC_TYPE);

            // set timestamp parsing
            timestampParsingEnabled = config.getBoolean(config.TIMESTAMP_PARSING_ENABLED);
            if (timestampParsingEnabled) {
                timestampParsingField = config.getString(config.TIMESTAMP_PARSING_FIELD);
                timestampFormat = config.getString(config.TIMESTAMP_PARSING_FORMAT);
            }

            // set message key
            keyParsingEnabled = config.getBoolean(config.MESSAGE_KEY_PARSING_ENABLED);
            if (keyParsingEnabled)
                keyParsingField = config.getString(config.MESSAGE_KEY_PARSING_FIELD);

            // set filtering producer
            String bootstrapServer = config.getString(config.SINK_BOOTSTRAP_SERVER);
            String producerLingerMs = config.getString(config.PRODUCER_LINGER_MS);
            String producerBatchSize = config.getString(config.PRODUCER_BATCH_SIZE);
            Properties producerProperties = KafkaProducerConfig.producer(bootstrapServer);
            producerProperties.put(ProducerConfig.LINGER_MS_CONFIG, producerLingerMs);
            producerProperties.put(ProducerConfig.BATCH_SIZE_CONFIG, producerBatchSize);
            producer = new KafkaProducer<>(producerProperties);

        } catch (Exception e) {
            throw new ConnectException(e.getMessage(), e);
        }

    }

    @Override
    public void put(Collection<SinkRecord> records) {
        for (SinkRecord record : records) {
            if (record.value() != null) {
                try {
                    String value = record.value().toString();
     
                    sendRecord(value);
                    
                } catch (Exception e) {
                    log.error(e.getMessage() + " / " + connectorName, e);
                }
            }
        }
    }

    private void sendRecord(String value) throws JsonMappingException, JsonProcessingException {
        ProducerRecord<String, String> sendRecord = getSinkRecord(value);
//        System.out.println("> sendRecord: "+ sendRecord);
        producer.send(sendRecord, new ProducerCallback());
    }

    private ProducerRecord<String, String> getSinkRecord(String value) throws JsonMappingException, JsonProcessingException {
        StringBuilder messageKey = new StringBuilder();
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode jsonNode = objectMapper.readTree(value);
        String key = keyParsingField.substring(keyParsingField.lastIndexOf(".") + 1); // @.field => key
//        System.out.println("> key: "+ key);
//        System.out.println("> jsonNode: "+ jsonNode);
        if (jsonNode.has(key)) {
            String digitalId = jsonNode.get(key).asText();
            ObjectNode jsonObject = JsonNodeFactory.instance.objectNode();
            jsonObject.put(key, digitalId);
            messageKey.append(jsonObject.toString());
            return new ProducerRecord<>(sourceTopicType+digitalId, messageKey.toString(), value);
        } else {
            return null;
        }
    }

    @Override
    public void flush(Map<TopicPartition, OffsetAndMetadata> offsets) {
    }

    @Override
    public void stop() {
        producer.flush();
        producer.close();
    }
}