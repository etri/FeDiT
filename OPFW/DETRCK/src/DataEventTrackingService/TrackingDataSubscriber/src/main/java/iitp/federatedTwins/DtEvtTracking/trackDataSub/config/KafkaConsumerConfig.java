package iitp.federatedTwins.DtEvtTracking.trackDataSub.config;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import iitp.federatedTwins.DtEvtTracking.trackDataSub.component.KafkaConsumer;

@EnableKafka
@Configuration
public class KafkaConsumerConfig {
	@Value("${spring.kafka.bootstrap-servers}")
	private String bootstrapServer;

	@Bean
	public ConsumerFactory<String, Object> consumerFactory() {

		Map<String, Object> props = new HashMap<>();
		props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServer);
		props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true"); // offset을 자동으로 commit하도록 함.
		props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest"); // offset이 없는경우는 가장 마지막의 오프셋값으로 설정
		props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 1); // max.poll.records 설정
		props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
//        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
		props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);

		// error handling deserializer
		props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
		props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);

		// delegate 하는 deserializer
		props.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS, StringDeserializer.class);
		props.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, StringDeserializer.class);

		// 들어오는 record 를 객체로 받기 위한 deserializer
		JsonDeserializer<Object> jsonDeserializer = new JsonDeserializer<>(Object.class, false);

//        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deserializer);
//        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(),jsonDeserializer);
		return new DefaultKafkaConsumerFactory<>(props);
	}

	@Bean
	public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
		ConcurrentKafkaListenerContainerFactory<String, Object> factory = new ConcurrentKafkaListenerContainerFactory<>();
		factory.setConsumerFactory(consumerFactory());
		return factory;
	}

// 수신하는 consumer 에서 record를 필터링할 수 있습니다. 
	@Bean
	public ConcurrentKafkaListenerContainerFactory<String, Object> filterListenerContainerFactory() {
		ConcurrentKafkaListenerContainerFactory<String, Object> factory = new ConcurrentKafkaListenerContainerFactory<>();
		factory.setConsumerFactory(consumerFactory());
		factory.setBatchListener(true);
//        factory.setRecordFilterStrategy(record -> Integer.parseInt(record.value().getAge()) > 30);
		return factory;
	}

	@Bean
	public HashMap<String, KafkaConsumer> kafkaConsumerinfo() {
		return new HashMap<String, KafkaConsumer>();
	}
}
