package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
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
  @Bean
  public Queue queue() {
    return new Queue(queueName, true, true, true);
  }

  @Bean
  public Queue trgEventMsgTransmitQueue() {
    return new Queue(RabbitMQConstant.RABBITMQ_QUEUE_TGR_EVENT_MESSAGE_TRANSMIT, true, true, true);
  }

  @Bean
  public Queue trgStatusMsgTransmitQueue() {
    return new Queue(RabbitMQConstant.RABBITMQ_QUEUE_TGR_STATUS_MESSAGE_TRANSMIT, true, true, true);
  }

  @Value("${rabbitmq.exchange.name}")
  private String exchangeName;

  @Value("${rabbitmq.routing.key}")
  private String routingKey;

  @Bean
  public TopicExchange exchange() {
    return new TopicExchange(exchangeName);
  }

  @Bean
  public Binding binding(Queue queue, TopicExchange exchange) {
    return BindingBuilder.bind(queue).to(exchange).with(routingKey);
  }

  @Bean
  public Binding tgrEvtMsgTransmitBinding(Queue trgEventMsgTransmitQueue, TopicExchange exchange) {
    return BindingBuilder.bind(trgEventMsgTransmitQueue).to(exchange).with(RabbitMQConstant.RABBITMQ_ROUTING_KEY_TGR_EVENT_TRANSMIT);
  }

  @Bean
  public Binding tgrStatusMsgTransmitBinding(Queue trgStatusMsgTransmitQueue, TopicExchange exchange) {
    return BindingBuilder.bind(trgStatusMsgTransmitQueue).to(exchange).with(RabbitMQConstant.RABBITMQ_ROUTING_KEY_TGR_STATUS_TRANSMIT);
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