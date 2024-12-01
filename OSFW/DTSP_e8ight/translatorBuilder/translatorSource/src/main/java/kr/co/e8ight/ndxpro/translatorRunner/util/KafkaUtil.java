package kr.co.e8ight.ndxpro.translatorRunner.util;

import kr.co.e8ight.ndxpro.translatorRunner.deserializer.CommonJsonDeserializer;
import kr.co.e8ight.ndxpro.translatorRunner.serializer.EntitySerializer;
import kr.co.e8ight.ndxpro.translatorRunner.serializer.ZonedDatetimeSerializer;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.ZonedDateTimeVo;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.IntegerDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.json.JSONObject;

import java.util.Properties;

public class KafkaUtil {

    Properties kafkaProducerProperties;
    Properties kafkaConsumerProperties;
    KafkaConsumer<Integer, JSONObject> kafkaConsumer;
    KafkaProducer<Integer, Entity> entityKafkaProducer;

    KafkaProducer<Integer, ZonedDateTimeVo> zonedDateTimeKafkaProducer;

    public KafkaUtil(String kafkaUrl) {
        kafkaProducerProperties = new Properties();
        kafkaProducerProperties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaUrl);
        kafkaProducerProperties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        kafkaProducerProperties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, EntitySerializer.class);
        entityKafkaProducer = new KafkaProducer<>(kafkaProducerProperties);

        kafkaProducerProperties = new Properties();
        kafkaProducerProperties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaUrl);
        kafkaProducerProperties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        kafkaProducerProperties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, ZonedDatetimeSerializer.class);
        zonedDateTimeKafkaProducer = new KafkaProducer<>(kafkaProducerProperties);

        kafkaConsumerProperties = new Properties();
        kafkaConsumerProperties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaUrl);
//        kafkaConsumerProperties.put(ConsumerConfig.GROUP_ID_CONFIG, "e8ight-group");
        kafkaConsumerProperties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
        kafkaConsumerProperties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, IntegerDeserializer.class);
        kafkaConsumerProperties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, CommonJsonDeserializer.class);
        kafkaConsumerProperties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, true);
        kafkaConsumerProperties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 20000);
        kafkaConsumerProperties.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 1000);
        kafkaConsumerProperties.put(ConsumerConfig.FETCH_MAX_BYTES_CONFIG, "10485880");
//        kafkaConsumer =  new KafkaConsumer<>(kafkaConsumerProperties);
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

    public KafkaProducer<Integer, Entity> getEntityKafkaProducer() {
        return entityKafkaProducer;
    }

    public KafkaProducer<Integer, ZonedDateTimeVo> getZonedDateTimeKafkaProducer() {
        return zonedDateTimeKafkaProducer;
    }
}
