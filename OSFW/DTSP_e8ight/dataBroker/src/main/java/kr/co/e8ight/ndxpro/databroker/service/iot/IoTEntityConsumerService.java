package kr.co.e8ight.ndxpro.databroker.service.iot;

import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntity;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class IoTEntityConsumerService {

    private final String TOPIC_NAME = "${spring.kafka.topic.entity}";

    private final String CONSUMER_GROUP = "${spring.kafka.consumer.group}";

    private final IoTEntityService ioTEntityService;

    public IoTEntityConsumerService(IoTEntityService ioTEntityService) {
        this.ioTEntityService = ioTEntityService;
    }

    public String payload;

    @KafkaListener(
//            id = "dataBroker-listener",
//            topicPartitions = {@TopicPartition(topic = TOPIC_NAME, partitions = {"0"})},
            topics = TOPIC_NAME,
            groupId = CONSUMER_GROUP,
//            errorHandler = "validationErrorHandler",
            containerFactory = "kafkaListenerContainerFactory"
//            autoStartup = "false"
    )
    void listen(ConsumerRecord<String, IoTEntity> consumerRecord, Acknowledgment ack) {
        IoTEntity entity = consumerRecord.value();
        log.debug("partition {}, {}", consumerRecord.toString(), ack.toString());
        payload = consumerRecord.toString();
        ack.acknowledge();
        ioTEntityService.saveIoTEntity(entity);
    }

    public String getPayload() {
        return payload;
    }
}
