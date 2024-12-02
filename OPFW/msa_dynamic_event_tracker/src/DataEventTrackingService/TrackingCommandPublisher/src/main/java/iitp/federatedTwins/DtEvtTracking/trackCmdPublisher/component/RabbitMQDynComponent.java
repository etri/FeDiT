package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.component;

import java.util.Collections;

import org.json.simple.JSONObject;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.rabbit.listener.adapter.MessageListenerAdapter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@Scope(value = "prototype")
public class RabbitMQDynComponent {

	@Autowired
	ApplicationContext ctx;

	private String exchangeName;

	public String routingKey;

	public String queueName;

	@Autowired
	private RabbitAdmin rabbitAdmin;

	@Autowired
	private ConnectionFactory connectionFactory;

	@Autowired
	private MessageConverter jackson2JsonMessageConverter;

	@Autowired
	public RabbitTemplate rabbitTemplate;


	public void addNewQueue(String exchangeName, String queueName, String routingKey) {
		this.exchangeName = exchangeName;
		this.routingKey = routingKey;
		this.queueName = queueName;

		Queue queue = new Queue(queueName, true, false, false);

		Binding binding = new Binding(
				queueName,
				Binding.DestinationType.QUEUE,
				exchangeName,
				routingKey,
				Collections.<String, Object>emptyMap()
				);
		rabbitAdmin.declareQueue(queue);
		rabbitAdmin.declareBinding(binding);
	}

	public MessageListenerAdapter listenerAdapter() {
		MessageListenerAdapter listenerAdapter = new MessageListenerAdapter(this, "receiveMessage");
		listenerAdapter.setDefaultListenerMethod("receiveMessage");
		listenerAdapter.setMessageConverter(jackson2JsonMessageConverter);

		return listenerAdapter;
	}

	public SimpleMessageListenerContainer initContainer() {
		SimpleMessageListenerContainer container = new SimpleMessageListenerContainer();
		container.setConnectionFactory(connectionFactory);
		container.setQueueNames(queueName);
		container.setMessageListener(listenerAdapter());

		return container;
	}


	/**
	 * Queue로 메시지를 발행
	 *
	 * @param messageDto 발행할 메시지의 DTO 객체
	 */
	public void sendMessage(JSONObject json) {
		rabbitTemplate.convertAndSend(exchangeName, routingKey, json);
	}

	public void sendMessage(JSONObject json, String sendRoutingKey) {
		rabbitTemplate.convertAndSend(exchangeName, sendRoutingKey, json);
	}

	public void receiveMessage(JSONObject json) {	
	}
}
