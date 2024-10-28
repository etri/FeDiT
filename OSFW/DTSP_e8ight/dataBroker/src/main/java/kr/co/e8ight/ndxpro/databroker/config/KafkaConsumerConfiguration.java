package kr.co.e8ight.ndxpro.databroker.config;

import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntity;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.KafkaListenerErrorHandler;
import org.springframework.kafka.support.converter.StringJsonMessageConverter;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
public class KafkaConsumerConfiguration {
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    ConsumerFactory<String, IoTEntity> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");    // 마지막 읽은 부분부터 Read
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 600000);        //default: 30000
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 1000);      //default: 3000
        props.put(ConsumerConfig.REQUEST_TIMEOUT_MS_CONFIG, 300000);      //default: 40000
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 200);          //default: 500
        props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 1000000);          //default: 300000
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);

        /**
         * enable.auto.commit(기본값은 true)auto.commit.interval.ms (기본값은 5000)
         * 컨슈머는 기본적으로 매 5초마다 카프카(Kafka)에 오프셋을 자동 커밋(commit)하거나 지정 토픽에서 데이터를 가져올 때마다 최신 오프셋을 커밋한다
         * 만약 중복 처리를 최대한 하고 싶지 않다면 메시지의 오프셋을 수동으로 커밋(commit)한다.
         * enable.auto.commit 속성의 값을 false로 변경해야 한다.(자연스럽게 auto.commit.interval.ms 값은 무시된다.)
         */
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), new JsonDeserializer<>(IoTEntity.class));
    }

//    ConsumerFactory<String, String> batchConsumerFactory() {
//        Map<String, Object> props = new HashMap<>();
//        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
//        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");    // 마지막 읽은 부분부터 Read
//        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
//        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, "500");
//        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 100000);        //default: 30000
//        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 30000);      //default: 3000
//        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
//        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
//
//
//        /**
//         * enable.auto.commit(기본값은 true)auto.commit.interval.ms (기본값은 5000)
//         * 컨슈머는 기본적으로 매 5초마다 카프카(Kafka)에 오프셋을 자동 커밋(commit)하거나 지정 토픽에서 데이터를 가져올 때마다 최신 오프셋을 커밋한다
//         * 만약 중복 처리를 최대한 하고 싶지 않다면 메시지의 오프셋을 수동으로 커밋(commit)한다.
//         * enable.auto.commit 속성의 값을 false로 변경해야 한다.(자연스럽게 auto.commit.interval.ms 값은 무시된다.)
//         */
//        return new DefaultKafkaConsumerFactory<>(props);
//    }

    @Bean
    ConcurrentKafkaListenerContainerFactory<String, IoTEntity> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, IoTEntity> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(3);
        //수동커밋 polling 설정
        factory.getContainerProperties().setPollTimeout(50000);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        return factory;
    }

//    @Bean
//    public ConcurrentKafkaListenerContainerFactory<String, String> batchKafkaListenerContainerFactory() {
//        ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
//        factory.setConsumerFactory(batchConsumerFactory());
//        factory.setBatchListener(true);
////        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.BATCH);
//        return factory;
//    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, IoTEntity> jsonKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, IoTEntity> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.setMessageConverter(new StringJsonMessageConverter());
        return factory;
    }

    ConsumerFactory<String, String> stringConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");    // 마지막 읽은 부분부터 Read
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 600000);        //default: 30000
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 1000);      //default: 3000
        props.put(ConsumerConfig.REQUEST_TIMEOUT_MS_CONFIG, 300000);      //default: 40000
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 200);          //default: 500
        props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 1000000);          //default: 300000
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

        /**
         * enable.auto.commit(기본값은 true)auto.commit.interval.ms (기본값은 5000)
         * 컨슈머는 기본적으로 매 5초마다 카프카(Kafka)에 오프셋을 자동 커밋(commit)하거나 지정 토픽에서 데이터를 가져올 때마다 최신 오프셋을 커밋한다
         * 만약 중복 처리를 최대한 하고 싶지 않다면 메시지의 오프셋을 수동으로 커밋(commit)한다.
         * enable.auto.commit 속성의 값을 false로 변경해야 한다.(자연스럽게 auto.commit.interval.ms 값은 무시된다.)
         */
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> stringKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(stringConsumerFactory());
        factory.setConcurrency(3);
        factory.getContainerProperties().setPollTimeout(50000);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        return factory;
    }

    @Bean
    public KafkaListenerErrorHandler validationErrorHandler() {
        return (m, e) -> {
            log.error(String.valueOf(m.getPayload()));
            log.error(e.getMessage());
            return null;
        };
    }
}