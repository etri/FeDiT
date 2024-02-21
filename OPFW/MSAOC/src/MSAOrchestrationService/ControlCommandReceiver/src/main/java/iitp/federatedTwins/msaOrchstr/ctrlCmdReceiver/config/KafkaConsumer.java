package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.config;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.context.annotation.Scope;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@Data
@Scope(value = "prototype")
public class KafkaConsumer {

	public String id;

	public String topic;

	public String groupId;

	public KafkaConsumer(String id, String topic, String groupId) {
		this.id = id;
		this.topic = topic;
		this.groupId = groupId;
	}

	private CountDownLatch latch = new CountDownLatch(10);
	private List<Object> payloads = new ArrayList<>();
	private Object payload;

	// record 를 수신하기 위한 consumer 설정
	@KafkaListener(id = "#{__listener.id}", topics = "#{__listener.topic}", groupId = "#{__listener.groupId}", containerFactory = "filterListenerContainerFactory")
	public void receive(ConsumerRecord<String, Object> consumerRecord) {
		payload = consumerRecord.value();
		System.out.println("received payload = {}" + payload.toString());
		payloads.add(payload);
		latch.countDown();
	}

	public List<Object> getPayloads() {
		return payloads;
	}

	public void resetLatch() {
		latch = new CountDownLatch(1);
	}
}