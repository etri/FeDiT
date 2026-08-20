package kr.co.e8ight.ndxpro.databroker.service.iot;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTObservedAt;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import kr.co.e8ight.ndxpro.databroker.util.DataBrokerDateFormat;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class IoTObservedAtConsumerService {

    private final String TOPIC_NAME = "${spring.kafka.topic.observedAt}";

    private final String CONSUMER_GROUP = "${spring.kafka.consumer.group}";

    private final IoTEntityService ioTEntityService;

    private final ObjectMapper objectMapper;

    public IoTObservedAtConsumerService(IoTEntityService ioTEntityService, ObjectMapper objectMapper) {
        this.ioTEntityService = ioTEntityService;
        this.objectMapper = objectMapper;
    }

    public String payload;

    @KafkaListener(
//            id = "dataBroker-listener",
//            topicPartitions = {@TopicPartition(topic = TOPIC_NAME, partitions = {"0"})},
            topics = TOPIC_NAME,
            groupId = CONSUMER_GROUP,
//            errorHandler = "validationErrorHandler",
            containerFactory = "stringKafkaListenerContainerFactory"
//            autoStartup = "false"
    )
    void listen(ConsumerRecord<String, String> consumerRecord, Acknowledgment ack) {
        String observedAt = consumerRecord.value();
        observedAt.replace("\"", "");
        log.debug("partition {}, {}", consumerRecord.toString(), ack.toString());
        payload = consumerRecord.toString();
        ack.acknowledge();
        HashMap<String, Object> message;
        try {
            message = (HashMap<String, Object>) objectMapper.readValue(observedAt, Map.class);
        } catch (JsonProcessingException e) {
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Bad Request Data.");
        }
        IoTObservedAt ioTObservedAt = IoTObservedAt.builder()
                .datetime(DataBrokerDateFormat.formatStringToDate(
                        DataBrokerDateFormat.DATE_TIME_FORMAT_WITH_TIME_ZONE,
                        String.valueOf(message.get("datetime"))))
                .scenarioId((int) message.get("scenarioId"))
                .scenarioType(String.valueOf(message.get("scenarioType")))
                .isFinish(String.valueOf(message.get("isFinish")))
                .build();
        ioTEntityService.saveObservedAt(ioTObservedAt);
    }

    public String getPayload() {
        return payload;
    }
}
