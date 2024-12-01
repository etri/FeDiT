package kr.co.e8ight.ndxpro.agentManager.service;


import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentType;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AgentConfigProvider {

    @Value("${flume.conf-dir}")
    private String flumeConfPath;

    @Value("${agent-manager.kafka-url}")
    private String kafkaUrl;

    public String getConfFileContents(Agent agent, AgentRequestDto requestDto) {
        StringBuilder confStringBuilder = new StringBuilder();
        confStringBuilder.append(requestDto.getName()).append(".sources = ").append("src").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".channels = ").append("ch_hadoop, ch_kafka").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sinks = ").append("sink_hadoop, sink_kafka").append("\n");

        confStringBuilder.append(requestDto.getName()).append(".sources.src.type = ").append(requestDto.getType().getClassPath()).append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sources.src.channels = ").append("ch_hadoop, ch_kafka").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sources.src.AGENT_ID = ").append(agent.getId()).append("\n");

        if ( requestDto.getType() == AgentType.HTTP) {
            confStringBuilder.append(requestDto.getName()).append(".sources.src.URL_ADDR = ").append(requestDto.getUrlAddress()).append("\n");
            confStringBuilder.append(requestDto.getName()).append(".sources.src.CONN_TERM = ").append(requestDto.getConnTerm()).append("\n");
            confStringBuilder.append(requestDto.getName()).append(".sources.src.METHOD = ").append(requestDto.getMethod()).append("\n");
            confStringBuilder.append(requestDto.getName()).append(".sources.src.JSON_BODY = ").append(requestDto.getBody()).append("\n");
        }

        confStringBuilder.append(requestDto.getName()).append(".channels.ch_hadoop.type = memory").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".channels.ch_hadoop.transactionCapacity = 1000").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".channels.ch_hadoop.capacity = 10000").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".channels.ch_kafka.type = memory").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".channels.ch_kafka.transactionCapacity = 1000").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".channels.ch_kafka.capacity = 10000").append("\n");

//        if ( requestDto.isSaveSource() ) {
//            confStringBuilder.append(requestDto.getAgentId()).append(".sinks.sink_hadoop.type = ").append("hdfs").append("\n");
//            confStringBuilder.append(requestDto.getAgentId()).append(".sinks.sink_hadoop.channel = ").append("ch_hadoop").append("\n");
//            confStringBuilder.append(requestDto.getAgentId()).append(".sinks.sink_hadoop.hdfs.path = ").append("hdfs://172.16.28.217:12378").append("\n");
//
//        }
        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.type = ").append("kr.co.e8ight.ndxpro.dataAdapter.sink.SignalableKafkaSink").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.channel = ").append("ch_kafka").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.kafka.bootstrap.servers = ").append(kafkaUrl).append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.kafka.producer.max.request.size = ").append("10485880").append("\n");

        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.kafka.topic = ").append(agent.getTopic()).append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.flumeBatchSize = ").append(1).append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.AGENT_ID = ").append(agent.getId()).append("\n");
        return confStringBuilder.toString();
    }

    public String getConfFilePath() {
        return flumeConfPath + "files/";
    }
}
