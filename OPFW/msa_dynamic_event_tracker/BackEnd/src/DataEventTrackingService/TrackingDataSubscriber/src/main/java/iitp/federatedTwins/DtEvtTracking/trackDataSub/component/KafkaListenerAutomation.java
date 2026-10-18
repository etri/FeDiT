package iitp.federatedTwins.DtEvtTracking.trackDataSub.component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.config.KafkaListenerEndpointRegistry;
import org.springframework.kafka.listener.MessageListenerContainer;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class KafkaListenerAutomation { 
  
    private final Logger logger = LoggerFactory.getLogger(KafkaListenerAutomation.class); 
  
    @Autowired
    KafkaListenerEndpointRegistry kafkaListenerEndpointRegistry; 
    
    @Autowired
	ConcurrentHashMap<String, KafkaConsumer> kafkaConsumerinfo; 
  
    public boolean startListener(String listenerId) { 
        MessageListenerContainer listenerContainer = kafkaListenerEndpointRegistry.getListenerContainer(listenerId); 
        assert listenerContainer != null : false; 
        listenerContainer.start(); 
        logger.info("{} Kafka Listener Started", listenerId); 
        return true; 
    } 
  
    public boolean stopListener(String listenerId) { 
        MessageListenerContainer listenerContainer = kafkaListenerEndpointRegistry.getListenerContainer(listenerId); 
        assert listenerContainer != null : false; 
        listenerContainer.stop(); 
        logger.info("{} Kafka Listener Stopped.", listenerId); 
        return true; 
    } 
    
    public boolean deleteListener(String listenerId) { 
    	if(stopListener(listenerId)) {
    		logger.info("delete before Kafka Listener : {}", kafkaListenerEndpointRegistry.getAllListenerContainers().size());
    		
    		kafkaListenerEndpointRegistry.unregisterListenerContainer(listenerId);
            logger.info("delete after Kafka Listener :  {}", kafkaListenerEndpointRegistry.getAllListenerContainers().size()); 
            
            Collection<KafkaConsumer> consumerList = kafkaConsumerinfo.values();
    		
    		if(consumerList != null && consumerList.size() > 0) {
    			for(KafkaConsumer consumer:consumerList) {
    				if(consumer.getConsumerId().equals(listenerId)) {												
    					consumerList.remove(consumer);
    					break;
    				}			
    			}
    		}            
    	}
    	
        return true; 
    } 
    
    public List<HashMap<String,String>> searchListener(){
    	
    	List<MessageListenerContainer> list = (List<MessageListenerContainer>) kafkaListenerEndpointRegistry.getAllListenerContainers();
    	List<HashMap<String,String>> listenerList = new ArrayList<>();
    	
    	for (int i = 0; i < list.size(); i++) {
    		HashMap<String,String> topic = new HashMap<>();
    		topic.put("listenerId", list.get(i).getListenerId());
    		topic.put("topic", list.get(i).getContainerProperties().getTopics()[0]);
    		listenerList.add(topic);
		}
    	
    	return listenerList;
    }
    
}