package kr.co.e8ight.ndxpro.agentManager.service.conf;

import java.util.Arrays;
import java.util.List;
import java.util.Properties;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentType;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class HttpConfFileProvider extends AbstractConfFileProvider {

    @Value("${agent-manager.kafka-url}")
    private String kafkaUrl;

    @Override
    public List<AgentType> getSupportedTypes() {
        return Arrays.asList(AgentType.HTTP, AgentType.HTTPS);
    }

    @Override
    public void validate(AgentRequestDto requestDto) {
        if ( isEmpty(requestDto.getUrlAddress()) ) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "URL address is required.");
        }
        if ( isEmpty(requestDto.getConnTerm()) ) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Connection term is required.");
        }
        if ( isEmpty(requestDto.getMethod()) ) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Http method is required.");
        }
    }

    @Override
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

        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.type = ").append("kr.co.e8ight.ndxpro.dataAdapter.sink.SignalableKafkaSink").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.channel = ").append("ch_kafka").append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.kafka.bootstrap.servers = ").append(kafkaUrl).append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.kafka.producer.max.request.size = ").append("10485880").append("\n");

        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.kafka.topic = ").append(agent.getTopic()).append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.flumeBatchSize = ").append(1).append("\n");
        confStringBuilder.append(requestDto.getName()).append(".sinks.sink_kafka.AGENT_ID = ").append(agent.getId()).append("\n");
        return confStringBuilder.toString();
    }

    @Override
    protected void validateRequiredEntries(Agent agent, Properties properties) {
        String name = agent.getName();
        requireKey(properties, name + ".sources");
        requireKey(properties, name + ".channels");
        requireKey(properties, name + ".sinks");

        // AGENT_ID 가 빠지면 SignalProcessor 가 생존 신호를 보내지 못해
        // AgentInspectorService 가 정상 동작 중인 agent 를 HANG/DIED 로 판정한다.
        requireValue(properties, name + ".sources.src.AGENT_ID", String.valueOf(agent.getId()));
        requireValue(properties, name + ".sinks.sink_kafka.AGENT_ID", String.valueOf(agent.getId()));

        // topic 이 DB 값과 어긋나면 하위 translator 가 엉뚱한 토픽을 구독한다.
        requireValue(properties, name + ".sinks.sink_kafka.kafka.topic", agent.getTopic());
    }

    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
}
