package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.component;

import org.json.simple.JSONObject;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@Repository
@RequiredArgsConstructor
public class RabbitMQComponent {
	@Value("${rabbitmq.exchange.name}")
	  private String exchangeName;

	  @Value("${rabbitmq.routing.key}")
	  private String routingKey;

	  @Autowired
	  public RabbitTemplate rabbitTemplate;
	  
	 
	  /**
	   * Queue로 메시지를 발행
	   *
	   * @param messageDto 발행할 메시지의 DTO 객체
	   */
	  public void sendMessage(JSONObject json) {
	    rabbitTemplate.convertAndSend(exchangeName, routingKey, json);
	  }
	  
	  public boolean sendMessage(JSONObject json, String sendRoutingKey) {
	    rabbitTemplate.convertAndSend(exchangeName, sendRoutingKey, json);
		return false;
	  }

}
