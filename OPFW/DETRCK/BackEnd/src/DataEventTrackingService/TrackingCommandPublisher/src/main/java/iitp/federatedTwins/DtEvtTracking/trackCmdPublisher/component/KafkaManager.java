package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.component;

import java.util.Collections;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ExecutionException;

import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.TopicListing;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class KafkaManager {
	@Value("${spring.kafka.bootstrap-servers}")
	private String bootstrapServer;
	
    private final static Logger logger = LoggerFactory.getLogger(KafkaManager.class);
	
	public void deleteTopic(String topicName) {
		
        Properties configs = new Properties();
        configs.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServer);
        AdminClient admin = AdminClient.create(configs);

        logger.info("topicName : {}" , topicName);
		admin.deleteTopics(Collections.singleton(topicName));

	}

	public void runner() throws InterruptedException, ExecutionException {

        Properties configs = new Properties();
        configs.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServer);
        AdminClient admin = AdminClient.create(configs);
		
        Map<String, TopicListing> topics = admin.listTopics().namesToListings().get();
        logger.info("topics : {}" , topics);

        for (String topicName : topics.keySet()) {
        	
        	admin.deleteTopics(Collections.singleton(topicName));
        	
		};
	  }

}
