package kr.co.n2m.platform.meta.architecture.config;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.ByteArraySerializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import kr.co.n2m.platform.meta.architecture.property.KafkaProperty;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
@ConditionalOnProperty(value = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class KafkaProducerConfig {

	@Autowired
	private KafkaProperty kafkaProperty;	
	
	/**
	 * <pre>운영 Profile 이 아닌 상태의 Kafka Producer 설정 값</pre>
	 * @Author		: junyl
	 * @Date		: 2019. 10. 17.
	 * @return
	 */
	public Map<String, Object> producerDefaultConfigs() {
		Map<String, Object> props =	new HashMap<String, Object>();
		
		props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaProperty.getKafkaServers());
		props.put(ProducerConfig.CLIENT_ID_CONFIG, kafkaProperty.getKafkaClientId());
		props.put(ProducerConfig.ACKS_CONFIG, "1");
		props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
		props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class);
		
		return props;
	}
	
	/**
	 * <pre>운영 Profile 상태의 Kafka Producer 설정 값 </pre>
	 * @Author		: junyl
	 * @Date		: 2019. 10. 17.
	 * @return
	 */
	public Map<String, Object> producerProdConfigs() {
		Map<String, Object> props =	new HashMap<String, Object>();
		
		// TODO 카프카 운영 설정 아직 모름. 아래 사항은 다른 곳의 운영 것을 복사한 것임... DT 에서는 알 수 없음!!
		props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaProperty.getKafkaServers());
		props.put(ProducerConfig.CLIENT_ID_CONFIG, kafkaProperty.getKafkaClientId());
		props.put(ProducerConfig.ACKS_CONFIG, "1");
		props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
		props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class.getName());
		props.put("security.protocol", "SASL_PLAINTEXT"); 
		props.put("sasl.mechanism", "PLAIN"); 
		props.put("sasl.jaas.config", String.format("org.apache.kafka.common.security.scram.ScramLoginModule required username=\"%s\" password=\"%s\";", kafkaProperty.getKafkaUserId(), kafkaProperty.getKafkaUserPw()));
		
		return props;
	}
	
	@Bean
	KafkaProducer<String, Object> kafkaProducer() {
		String active = kafkaProperty.getActiveProfile();
		// TODO 운영 설정이 달라야 하는 경우만 다시 설정할 것!
//		if ("prod".equals(active) || "meta_prod".equals(active)) {
//			log.debug("onload prod kafka-producer-config!!");
//			return new KafkaProducer<String, Object>(producerProdConfigs());	
//		}
		log.debug("onload default kafka-producer-config!!");
		return new KafkaProducer<String, Object>(producerDefaultConfigs());
	}
	
}
