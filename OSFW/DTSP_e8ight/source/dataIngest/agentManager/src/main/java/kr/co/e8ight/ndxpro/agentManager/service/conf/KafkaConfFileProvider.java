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
 * source(외부 kafka) -> memory channel -> SignalableKafkaSink(내부 파이프라인 kafka) 구조다.
 * 예전에는 KafkaChannel 이 바로 내부 토픽에 썼지만, 그 경로로는 kafka 헤더를 붙일 수 없어
 * 하위 translator 가 어느 agent 의 메시지인지 구분하지 못했다. HTTP agent 와 같은 sink 를 거치게 해
 * 수집 agent id 헤더(ndx-agent-id)를 붙인다.
 */
@Component
public class KafkaConfFileProvider extends AbstractConfFileProvider {

    private static final String SOURCE_NAME = "source1";
    private static final String CHANNEL_NAME = "ch_kafka";
    private static final String SINK_NAME = "sink_kafka";
    /** agent 마다 consumer group 을 따로 써야 같은 외부 토픽을 읽는 agent 끼리 메시지를 나눠 갖지 않는다. */
    private static final String CONSUMER_GROUP_ID_PREFIX = "fdt-agent-";
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
        String sink = name + ".sinks." + SINK_NAME;
        StringBuilder confStringBuilder = new StringBuilder();

        confStringBuilder.append("# Define the agent name").append("\n");
        confStringBuilder.append(name).append(".sources = ").append(SOURCE_NAME).append("\n");
        confStringBuilder.append(name).append(".channels = ").append(CHANNEL_NAME).append("\n");
        confStringBuilder.append(name).append(".sinks = ").append(SINK_NAME).append("\n");
        confStringBuilder.append("\n");

        confStringBuilder.append("# Define source").append("\n");
        confStringBuilder.append(source).append(".type = ").append(requestDto.getType().getClassPath()).append("\n");
        confStringBuilder.append(source).append(".channels = ").append(CHANNEL_NAME).append("\n");
        confStringBuilder.append(source).append(".kafka.bootstrap.servers = ").append(requestDto.getUrlAddress()).append("\n");
        confStringBuilder.append(source).append(".kafka.topics = ").append(requestDto.getSourceTopic()).append("\n");
        confStringBuilder.append("\n");
        confStringBuilder.append(source).append(".kafka.consumer.group.id = ").append(CONSUMER_GROUP_ID_PREFIX).append(agent.getId()).append("\n");
        confStringBuilder.append(source).append(".kafka.consumer.auto.offset.reset = ").append(AUTO_OFFSET_RESET).append("\n");
        confStringBuilder.append("\n");
        confStringBuilder.append("\n");

        confStringBuilder.append("# Define channel").append("\n");
        confStringBuilder.append(channel).append(".type = memory").append("\n");
        confStringBuilder.append(channel).append(".transactionCapacity = 1000").append("\n");
        confStringBuilder.append(channel).append(".capacity = 10000").append("\n");
        confStringBuilder.append("\n");

        confStringBuilder.append("# Define sink").append("\n");
        confStringBuilder.append(sink).append(".type = ").append("kr.co.e8ight.ndxpro.dataAdapter.sink.SignalableKafkaSink").append("\n");
        confStringBuilder.append(sink).append(".channel = ").append(CHANNEL_NAME).append("\n");
        confStringBuilder.append(sink).append(".kafka.bootstrap.servers = ").append(kafkaUrl).append("\n");
        confStringBuilder.append(sink).append(".kafka.producer.max.request.size = ").append("10485880").append("\n");
        confStringBuilder.append(sink).append(".kafka.topic = ").append(agent.getTopic()).append("\n");
        // KafkaSource 는 원본 토픽 이름을 'topic' 헤더에 넣는다. override 를 끄지 않으면 내부 kafka 의 원본 토픽 이름으로 보낸다.
        confStringBuilder.append(sink).append(".allowTopicOverride = false").append("\n");
        confStringBuilder.append(sink).append(".AGENT_ID = ").append(agent.getId()).append("\n");

        return confStringBuilder.toString();
    }

    @Override
    protected void validateRequiredEntries(Agent agent, Properties properties) {
        String name = agent.getName();
        requireKey(properties, name + ".sources");
        requireKey(properties, name + ".channels");
        requireKey(properties, name + ".sinks");

        // AGENT_ID 가 빠지면 메시지에 agent id 헤더가 붙지 않아 translator 가 출처를 구분하지 못한다.
        requireValue(properties, name + ".sinks." + SINK_NAME + ".AGENT_ID", String.valueOf(agent.getId()));

        // topic 이 DB 값과 어긋나면 하위 translator 가 엉뚱한 토픽을 구독한다.
        requireValue(properties, name + ".sinks." + SINK_NAME + ".kafka.topic", agent.getTopic());
    }

    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
}
