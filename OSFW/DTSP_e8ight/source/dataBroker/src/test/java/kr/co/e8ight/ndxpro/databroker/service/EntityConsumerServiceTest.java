package kr.co.e8ight.ndxpro.databroker.service;

import kr.co.e8ight.ndxpro.databroker.config.TestConfiguration;
import kr.co.e8ight.ndxpro.databroker.service.kafka.KafkaConsumer;
import kr.co.e8ight.ndxpro.databroker.service.kafka.KafkaProducer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@DirtiesContext
@SpringBootTest(classes = {
        KafkaConsumer.class,
        KafkaProducer.class,
        KafkaAutoConfiguration.class
})
@EmbeddedKafka(partitions = 1, topics = "test.pintel.vissim.vehicle.json", brokerProperties = {"listeners=PLAINTEXT://localhost:9092", "port=9092"})
public class EntityConsumerServiceTest {

    private String testEntity = TestConfiguration.testEntityString;

    @Autowired
    private KafkaConsumer consumer;

    @Autowired
    private KafkaProducer producer;

    @Value("${spring.kafka.topic.entity}")
    private String TOPIC_NAME;

    @Test
    @DisplayName("Kafka 적재 및 수집 테스트")
    public void produceAndConsumeDataTest() throws InterruptedException {
        // given

        // when
        producer.send(TOPIC_NAME, testEntity);

        // then
        boolean messageConsumed = consumer.getLatch().await(10, TimeUnit.SECONDS);
        assertTrue(messageConsumed);
//        System.out.println("consumer.getPayload() = " + consumer.getPayload());
    }
}
