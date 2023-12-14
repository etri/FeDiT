package kr.co.e8ight.ndxpro.databroker.service.kafka;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.TopicPartition;
import org.springframework.stereotype.Component;

import java.util.concurrent.CountDownLatch;

@Slf4j
@Component
public class KafkaConsumer {

    private final String TOPIC_NAME = "${spring.kafka.topic.entity}";

    private final String CONSUMER_GROUP = "${spring.kafka.consumer.group}";

    private CountDownLatch latch = new CountDownLatch(1);

    private String payload;

    @KafkaListener(
            topicPartitions = {@TopicPartition(topic = TOPIC_NAME, partitions = {"0"})},
//            topics = TOPIC_NAME,
            groupId = CONSUMER_GROUP,
            properties = {"enable.auto.commit:false", "auto.offset.reset:earliest"}
    )
    public void listen(ConsumerRecord<String, String> consumerRecord) {
        log.debug("received data={}", consumerRecord.value());
        payload = consumerRecord.toString();
        log.debug("partition {}", consumerRecord.toString());
        latch.countDown();
    }

    public void resetLatch() {
        latch = new CountDownLatch(1);
    }

    public CountDownLatch getLatch() {
        return latch;
    }

    public String getPayload() {
        return payload;
    }
}
