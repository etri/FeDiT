package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.config;

import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.kafka.core.KafkaProducerException;
import org.springframework.kafka.core.KafkaSendCallback;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;
import org.springframework.util.concurrent.ListenableFuture;

@Component
public class KafkaProducer {

	private final Logger log = LoggerFactory.getLogger(this.getClass());
    
	@Autowired(required=false)
	@Qualifier("poolHttpClientConnManager")
	private PoolingHttpClientConnectionManager connManager;
	
	@Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;
	
    public void send(String topic, String payload) throws Exception{
    	ListenableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, payload);
        future.addCallback(new KafkaSendCallback<>() {

			@Override
			public void onSuccess(SendResult<String, Object> result) {
				// TODO Auto-generated method stub
				log.info("Success to send message.");
				log.info("Sent message=[" + payload + "] with offset=[" + result.getRecordMetadata().offset() + "]");
				
			}
			
			@Override
			public void onFailure(KafkaProducerException ex) {
				// TODO Auto-generated method stub
              ProducerRecord<Object, Object> failedProducerRecord = ex.getFailedProducerRecord();
              log.error("Fail to send message.", failedProducerRecord);
              
              //실패처리
              throw new RuntimeException(ex);
              
			}
        });
        
    }
}