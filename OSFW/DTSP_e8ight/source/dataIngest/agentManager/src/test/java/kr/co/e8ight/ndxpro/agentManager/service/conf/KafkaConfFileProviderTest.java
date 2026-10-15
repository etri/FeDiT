package kr.co.e8ight.ndxpro.agentManager.service.conf;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Collections;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentType;
import kr.co.e8ight.ndxpro.agentManager.domain.KafkaAgent;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.DataModelDto;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class KafkaConfFileProviderTest {

    private KafkaConfFileProvider provider;

    @BeforeEach
    void setUp() {
        provider = new KafkaConfFileProvider();
        ReflectionTestUtils.setField(provider, "kafkaUrl", "kafka-server:19092");
    }

    private AgentRequestDto requestDto() {
        return AgentRequestDto.builder()
                .name("FDO_F-KR-109941-0020")
                .type(AgentType.KAFKA)
                .models(Collections.singletonList(new DataModelDto()))
                .urlAddress("kafka-server:9092")
                .sourceTopic("FDO_F-KR-109941-0020")
                .isCustomTopic(true)
                .topic("fdt_topic")
                .build();
    }

    @Test
    @DisplayName("KAFKA agent의 conf 파일은 주석과 빈 줄까지 정해진 형식으로 생성된다")
    void getConfFileContents() {
        AgentRequestDto requestDto = requestDto();
        KafkaAgent agent = KafkaAgent.create(requestDto, "/opt/flume/conf/files/");
        agent.setTopic("fdt_topic");
        ReflectionTestUtils.setField(agent, "id", 7L);

        String contents = provider.getConfFileContents(agent, requestDto);

        String expected =
                "# Define the agent name\n"
                + "FDO_F-KR-109941-0020.sources = source1\n"
                + "FDO_F-KR-109941-0020.channels = ch_kafka\n"
                + "FDO_F-KR-109941-0020.sinks = sink_kafka\n"
                + "\n"
                + "# Define source\n"
                + "FDO_F-KR-109941-0020.sources.source1.type = org.apache.flume.source.kafka.KafkaSource\n"
                + "FDO_F-KR-109941-0020.sources.source1.channels = ch_kafka\n"
                + "FDO_F-KR-109941-0020.sources.source1.kafka.bootstrap.servers = kafka-server:9092\n"
                + "FDO_F-KR-109941-0020.sources.source1.kafka.topics = FDO_F-KR-109941-0020\n"
                + "\n"
                + "FDO_F-KR-109941-0020.sources.source1.kafka.consumer.group.id = fdt-agent-7\n"
                + "FDO_F-KR-109941-0020.sources.source1.kafka.consumer.auto.offset.reset = latest\n"
                + "\n"
                + "\n"
                + "# Define channel\n"
                + "FDO_F-KR-109941-0020.channels.ch_kafka.type = memory\n"
                + "FDO_F-KR-109941-0020.channels.ch_kafka.transactionCapacity = 1000\n"
                + "FDO_F-KR-109941-0020.channels.ch_kafka.capacity = 10000\n"
                + "\n"
                + "# Define sink\n"
                + "FDO_F-KR-109941-0020.sinks.sink_kafka.type = kr.co.e8ight.ndxpro.dataAdapter.sink.SignalableKafkaSink\n"
                + "FDO_F-KR-109941-0020.sinks.sink_kafka.channel = ch_kafka\n"
                + "FDO_F-KR-109941-0020.sinks.sink_kafka.kafka.bootstrap.servers = kafka-server:19092\n"
                + "FDO_F-KR-109941-0020.sinks.sink_kafka.kafka.producer.max.request.size = 10485880\n"
                + "FDO_F-KR-109941-0020.sinks.sink_kafka.kafka.topic = fdt_topic\n"
                + "FDO_F-KR-109941-0020.sinks.sink_kafka.allowTopicOverride = false\n"
                + "FDO_F-KR-109941-0020.sinks.sink_kafka.AGENT_ID = 7\n";

        assertThat(contents).isEqualTo(expected);
    }

    @Test
    @DisplayName("sourceTopic이 없으면 검증에서 걸러진다")
    void validateSourceTopicRequired() {
        AgentRequestDto requestDto = AgentRequestDto.builder()
                .name("agent")
                .type(AgentType.KAFKA)
                .urlAddress("kafka-server:9092")
                .isCustomTopic(false)
                .build();

        assertThatThrownBy(() -> provider.validate(requestDto))
                .isInstanceOf(AgentException.class)
                .hasMessageContaining("source topic");
    }
}
