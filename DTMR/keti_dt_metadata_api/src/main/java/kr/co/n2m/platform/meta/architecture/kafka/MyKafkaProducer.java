package kr.co.n2m.platform.meta.architecture.kafka;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Map;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import kr.co.n2m.platform.meta.architecture.property.KafkaProperty;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import kr.co.n2m.platform.meta.resource.metadata.service.DataReceivedHistService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@ConditionalOnProperty(value = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class MyKafkaProducer {
	
	@Autowired
	private KafkaProperty kafkaProperty;

	@Autowired
	private KafkaProducer<String, Object> kafkaProducer;
	
	@Autowired
	private DataReceivedHistService dataReceivedHistService;
	
	@Async("kafkaSendExecutor")
	public void send(String topic, Map<String, Object> sendData) {
		
		String threadName = Thread.currentThread().getName();
		log.debug("Thread Name : " + threadName);
		
		log.debug("##########################");
		log.debug(topic);
		log.debug(kafkaProperty.getKafkaServers());
		log.debug("##########################");
		String sendDataJson = JsonUtil.toJson(sendData);
		log.debug("##########################");
		log.debug("전달데이터 : " + sendDataJson);
		log.debug("##########################");
		
		// 2024-03-21 인터페이스 로그
		String ifLogId = null;
		try {
			ifLogId = dataReceivedHistService.createIfLog((String)sendData.get("key") + "::" + (String)sendData.get("action"), sendDataJson, topic);
		}
		catch (NullPointerException|ClassCastException e1) {
			log.debug("Producer.java - send ERROR", e1);
		}
		catch(Exception e1) {
			log.debug("Producer.java - send ERROR", e1);
		}
		
		long startTime = System.currentTimeMillis();
		log.debug("##########################");
		
		byte[] b = sendDataJson.getBytes();		
		byte[] c = null;
		
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream( );
		try {
			outputStream.write( b );
			c = outputStream.toByteArray( );
			ProducerRecord<String, Object> producerRecord = new ProducerRecord<String, Object>(topic, this.getLocalHostName("localhost"), c);
			kafkaProducer.send(producerRecord, new KafkaCallback(startTime, c));
			
		} catch (IOException e) {
			log.debug("파싱오류로 전송실패");
			
			// 2024-03-21 인터페이스 로그
			try {
				dataReceivedHistService.modifyIfLogResult(ifLogId, "parsing error");
			}
			catch(Exception e1) {
				log.debug("인터페이스 로그 ERROR " + e1);
			}
			
		} finally {
			try {
				outputStream.close();
			} catch (IOException e1) {
				log.debug("Producer Close ERROR", e1);
			}
		}
	}
	
	public String getLocalHostName(String defaultName) {
		String hostName = "";
		try {
			InetAddress local = InetAddress.getLocalHost();
			hostName = local.getHostName();
		} catch (UnknownHostException e) {
			hostName = defaultName;
		}
		return hostName;
	}	
	
}
