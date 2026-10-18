package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import iitp.federatedTwins.DtEvtTracking.common.util.RabbitMQConstant;

@Configuration
public class RabbitMQConfig {

  @Value("${spring.rabbitmq.host}")
  private String rabbitmqHost;

  @Value("${spring.rabbitmq.port}")
  private int rabbitmqPort;

  @Value("${spring.rabbitmq.username}")
  private String rabbitmqUsername;

  @Value("${spring.rabbitmq.password}")
  private String rabbitmqPassword;

  @Value("${rabbitmq.queue.name}")
  private String queueName;
  
  @Value("${rabbitmq.exchange.name}")
  private String exchangeName;

  @Value("${rabbitmq.routing.key}")
  private String routingKey;
  
  @Bean
  public Queue queue() {
    return new Queue(queueName, true, true, true);
  }

  @Bean
  public Queue pubTrackingCommandSendQueue() {
    return new Queue(RabbitMQConstant.RABBITMQ_QUEUE_PUB_TRACKING_COMMAND_SEND, true, true, true);
  }
  
  @Bean
  public Queue pubTrackingProcessSendQueue() {
    return new Queue(RabbitMQConstant.RABBITMQ_QUEUE_PUB_TRACKING_PROCESS_SEND, true, true, true);
  }
  
  @Bean
  public Queue pubTopicDeleteQueue() {
    return new Queue(RabbitMQConstant.RABBITMQ_QUEUE_PUB_TOPIC_DELETE, true, true, true);
  }

  @Bean
  public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
      return new RabbitAdmin(connectionFactory);
  }

  @Bean
  public TopicExchange exchange() {
    return new TopicExchange(exchangeName);
  }

  @Bean
  public Binding binding(Queue queue, TopicExchange exchange) {
    return BindingBuilder.bind(queue).to(exchange).with(routingKey);
  }

  @Bean
  public Binding pubTrackingCommandSendBinding(Queue pubTrackingCommandSendQueue, TopicExchange exchange) {
    return BindingBuilder.bind(pubTrackingCommandSendQueue).to(exchange).with(RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TRACKING_COMMAND_SEND);
  }
  
  @Bean
  public Binding pubTrackingProcessSendBinding(Queue pubTrackingProcessSendQueue, TopicExchange exchange) {
    return BindingBuilder.bind(pubTrackingProcessSendQueue).to(exchange).with(RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TRACKING_PROCESS_SEND);
  }
  
  @Bean
  public Binding pubTopicDeleteBinding(Queue pubTopicDeleteQueue, TopicExchange exchange) {
    return BindingBuilder.bind(pubTopicDeleteQueue).to(exchange).with(RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TOPIC_DELETE);
  }
  
  @Bean
  public ConnectionFactory connectionFactory() {
    CachingConnectionFactory connectionFactory = new CachingConnectionFactory();
    connectionFactory.setHost(rabbitmqHost);
    connectionFactory.setPort(rabbitmqPort);
    connectionFactory.setUsername(rabbitmqUsername);
    connectionFactory.setPassword(rabbitmqPassword);
    return connectionFactory;
  }

  @Bean
  public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
    RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
    rabbitTemplate.setMessageConverter(jackson2JsonMessageConverter());
    return rabbitTemplate;
  }

  @Bean
  public MessageConverter jackson2JsonMessageConverter() {
    return new Jackson2JsonMessageConverter();
  }
}