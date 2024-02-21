package iitp.federatedTwins.DtEvtTracking.trackDataSub.config;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.TrackingDataSubscriberService;
import lombok.Data;

@Component
@Data
@Scope(value = "prototype")
public class KafkaConsumer {
	
	public String id;

    public String topic;
    
    public String groupId;
    
    public int resId;
    
    public int proId;
    
    @Autowired
	public TrackingDataSubscriberService rsDtConsumerService;

    public KafkaConsumer(String id, String topic, String groupId, int resId, int proId) {
        this.id = id;
        this.topic = topic;
        this.groupId = groupId;
        this.resId = resId;
        this.proId = proId;
    }

    private CountDownLatch latch = new CountDownLatch(10);
    private List<Object> payloads = new ArrayList<>();
    private Object payload;

    @KafkaListener(id = "#{__listener.id}", topics = "#{__listener.topic}", groupId = "#{__listener.groupId}", containerFactory = "filterListenerContainerFactory")
    public void receive(ConsumerRecord<String, Object> consumerRecord) throws Exception {
        payload = consumerRecord.value();
        System.out.println("received payload = {}"+payload.toString());
        payloads.add(payload);
        
        rsDtConsumerService.getUpdateTopic(payload.toString(), resId, proId);
        
        latch.countDown();
    }

    public List<Object> getPayloads() {
        return payloads;
    }

    public void resetLatch() {
        latch = new CountDownLatch(1);
    }
}