package kr.co.n2m.platform.meta.architecture.kafka;

import org.apache.kafka.clients.producer.Callback;
import org.apache.kafka.clients.producer.RecordMetadata;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class KafkaCallback implements Callback {
		
	private final long startTime;
	private final Object message;
	
	public KafkaCallback(long startTime, Object message) {
		this.startTime = startTime;
		this.message = message;
	}
	
	public void onCompletion(RecordMetadata metadata, Exception exception) { // 비동기 콜백 함수        
		long elapsedTime = System.currentTimeMillis() - startTime;
		if (metadata != null) {
			log.info("respone-message(" +  message + ") sent to partition(" + metadata.partition() +"), " + "offset(" + metadata.offset() + ") in " + elapsedTime + "ms");
		} else {
			log.info("error!!!!!!!!!!");
		}
	}

}
