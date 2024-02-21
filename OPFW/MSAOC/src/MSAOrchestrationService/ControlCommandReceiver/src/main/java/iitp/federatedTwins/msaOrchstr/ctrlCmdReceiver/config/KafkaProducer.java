package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.config;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class KafkaProducer {

    public KafkaTemplate<String, Object> kafkaTemplate;

    public void send(String topic, Object payload) {
        System.out.println("sending payloa={} to topic={}"+payload+topic);
        kafkaTemplate.send(topic, payload);
    }
}