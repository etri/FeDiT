package kr.co.e8ight.ndxpro.translatorRunner.util;

import kr.co.e8ight.ndxpro.translatorRunner.serializer.ZonedDatetimeSerializer;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.ZonedDateTimeVo;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.common.serialization.StringSerializer;
import org.apache.kafka.streams.StreamsConfig;
import org.json.JSONObject;

import java.util.Properties;

public class KafkaUtil {

    Properties kafkaProducerProperties;
    Properties kafkaConsumerProperties;
    Properties kafkaStreamsProperties;
    KafkaConsumer<Integer, JSONObject> kafkaConsumer;
    KafkaProducer<Integer, Entity> entityKafkaProducer;

    KafkaProducer<Integer, ZonedDateTimeVo> zonedDateTimeKafkaProducer;

    public KafkaUtil(String kafkaUrl) {
//        kafkaProducerProperties = new Properties();
//        kafkaProducerProperties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaUrl);
//        kafkaProducerProperties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
//        kafkaProducerProperties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, EntitySerializer.class);
//        entityKafkaProducer = new KafkaProducer<>(kafkaProducerProperties);
//
        kafkaProducerProperties = new Properties();
        kafkaProducerProperties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaUrl);
        kafkaProducerProperties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        kafkaProducerProperties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, ZonedDatetimeSerializer.class);
        zonedDateTimeKafkaProducer = new KafkaProducer<>(kafkaProducerProperties);

//        kafkaConsumerProperties = new Properties();
//        kafkaConsumerProperties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaUrl);
////        kafkaConsumerProperties.put(ConsumerConfig.GROUP_ID_CONFIG, "e8ight-group");
//        kafkaConsumerProperties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
//        kafkaConsumerProperties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, IntegerDeserializer.class);
//        kafkaConsumerProperties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, CommonJsonDeserializer.class);
//        kafkaConsumerProperties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, true);
//        kafkaConsumerProperties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 20000);
//        kafkaConsumerProperties.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 1000);
////        kafkaConsumer =  new KafkaConsumer<>(kafkaConsumerProperties);

        kafkaStreamsProperties = new Properties();
        kafkaStreamsProperties.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaUrl);

        kafkaStreamsProperties.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.Long().getClass());
        kafkaStreamsProperties.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());
    }

    public Properties getKafkaProducerProperties() {
        return kafkaProducerProperties;
    }

    public Properties getKafkaConsumerProperties() {
        return kafkaConsumerProperties;
    }

    public KafkaConsumer<Integer, JSONObject> getKafkaConsumer(Long translatorId) {
        kafkaConsumerProperties.put(ConsumerConfig.GROUP_ID_CONFIG, "e8ight-translator-"+translatorId);
        kafkaConsumer =  new KafkaConsumer<>(kafkaConsumerProperties);
        return kafkaConsumer;
    }

    public Properties getKafkaStreamsProperties(Long translatorId) {
        kafkaStreamsProperties.put(StreamsConfig.APPLICATION_ID_CONFIG, "e8ight-translator-"+translatorId);
        kafkaStreamsProperties.put(StreamsConfig.DEFAULT_DESERIALIZATION_EXCEPTION_HANDLER_CLASS_CONFIG, AlertAndFailDeserializationExceptionHandler.class);
        kafkaStreamsProperties.put(StreamsConfig.DEFAULT_PRODUCTION_EXCEPTION_HANDLER_CLASS_CONFIG, AlertAndFailProductionExceptionHandler.class);
        return kafkaStreamsProperties;
    }

    public KafkaProducer<Integer, Entity> getEntityKafkaProducer() {
        return entityKafkaProducer;
    }

    public KafkaProducer<Integer, ZonedDateTimeVo> getZonedDateTimeKafkaProducer() {
        return zonedDateTimeKafkaProducer;
    }
}
