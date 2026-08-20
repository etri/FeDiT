package kr.co.e8ight.ndxpro.agentManager.service.conf;

import java.util.Collections;
import java.util.List;
import java.util.Properties;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentType;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 외부 Kafka 를 수집원으로 하는 agent 의 conf 생성기.
 * source(외부 kafka) -> KafkaChannel(내부 파이프라인 kafka) 구조라 sink 를 두지 않는다.
 */
@Component
public class KafkaConfFileProvider extends AbstractConfFileProvider {

    private static final String SOURCE_NAME = "source1";
    private static final String CHANNEL_NAME = "ch_kafka";
    private static final String CONSUMER_GROUP_ID = "fdt-consumer-group";
    private static final String AUTO_OFFSET_RESET = "latest";

    @Value("${agent-manager.kafka-url}")
    private String kafkaUrl;

    @Override
    public List<AgentType> getSupportedTypes() {
        return Collections.singletonList(AgentType.KAFKA);
    }

    @Override
    public void validate(AgentRequestDto requestDto) {
        if ( isEmpty(requestDto.getUrlAddress()) ) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Kafka bootstrap servers are required.");
        }
        if ( isEmpty(requestDto.getSourceTopic()) ) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Kafka source topic is required.");
        }
    }

    @Override
    public String getConfFileContents(Agent agent, AgentRequestDto requestDto) {
        String name = requestDto.getName();
        String source = name + ".sources." + SOURCE_NAME;
        String channel = name + ".channels." + CHANNEL_NAME;
        StringBuilder confStringBuilder = new StringBuilder();

        confStringBuilder.append("# Define the agent name").append("\n");
        confStringBuilder.append(name).append(".sources = ").append(SOURCE_NAME).append("\n");
        confStringBuilder.append(name).append(".channels = ").append(CHANNEL_NAME).append("\n");
        confStringBuilder.append("\n");

        confStringBuilder.append("# Define source").append("\n");
        confStringBuilder.append(source).append(".type = ").append(requestDto.getType().getClassPath()).append("\n");
        confStringBuilder.append(source).append(".channels = ").append(CHANNEL_NAME).append("\n");
        confStringBuilder.append(source).append(".kafka.bootstrap.servers = ").append(requestDto.getUrlAddress()).append("\n");
        confStringBuilder.append(source).append(".kafka.topics = ").append(requestDto.getSourceTopic()).append("\n");
        confStringBuilder.append("\n");
        confStringBuilder.append(source).append(".kafka.consumer.group.id = ").append(CONSUMER_GROUP_ID).append("\n");
        confStringBuilder.append(source).append(".kafka.consumer.auto.offset.reset = ").append(AUTO_OFFSET_RESET).append("\n");
        confStringBuilder.append("\n");
        confStringBuilder.append("\n");

        confStringBuilder.append("# Define channel").append("\n");
        confStringBuilder.append(channel).append(".type = ").append("org.apache.flume.channel.kafka.KafkaChannel").append("\n");
        confStringBuilder.append(channel).append(".kafka.bootstrap.servers = ").append(kafkaUrl).append("\n");
        confStringBuilder.append(channel).append(".kafka.topic = ").append(agent.getTopic()).append("\n");
        confStringBuilder.append(channel).append(".parseAsFlumeEvent = ").append("false").append("\n");

        return confStringBuilder.toString();
    }

    @Override
    protected void validateRequiredEntries(Agent agent, Properties properties) {
        String name = agent.getName();
        requireKey(properties, name + ".sources");
        requireKey(properties, name + ".channels");

        // KAFKA 는 sink 없이 KafkaChannel 이 목적지 역할을 하므로
        // 검증 대상 topic 도 sink 가 아니라 channel 쪽이다. AGENT_ID 는 쓰지 않는다.
        requireValue(properties, name + ".channels." + CHANNEL_NAME + ".kafka.topic", agent.getTopic());
    }

    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
}
