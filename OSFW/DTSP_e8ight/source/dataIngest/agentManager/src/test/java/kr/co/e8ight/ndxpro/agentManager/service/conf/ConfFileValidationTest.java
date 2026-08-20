package kr.co.e8ight.ndxpro.agentManager.service.conf;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Collections;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentType;
import kr.co.e8ight.ndxpro.agentManager.domain.HttpAgent;
import kr.co.e8ight.ndxpro.agentManager.domain.KafkaAgent;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.DataModelDto;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

@DisplayName("직접 편집한 conf 파일 검증")
class ConfFileValidationTest {

    @Nested
    @DisplayName("KAFKA 타입")
    class Kafka {

        private KafkaConfFileProvider provider;
        private Agent agent;
        private String validConf;

        @BeforeEach
        void setUp() {
            provider = new KafkaConfFileProvider();
            ReflectionTestUtils.setField(provider, "kafkaUrl", "pipeline-kafka-1:19092");

            AgentRequestDto requestDto = AgentRequestDto.builder()
                    .name("kafkaAgent")
                    .type(AgentType.KAFKA)
                    .models(Collections.singletonList(new DataModelDto()))
                    .urlAddress("220.124.222.84:9092")
                    .sourceTopic("source-topic")
                    .isCustomTopic(true)
                    .topic("fdt_topic")
                    .build();
            agent = KafkaAgent.create(requestDto, "/opt/flume/conf/files/");
            agent.setTopic("fdt_topic");
            validConf = provider.getConfFileContents(agent, requestDto);
        }

        @Test
        @DisplayName("생성된 conf 는 그대로 통과한다")
        void acceptsGeneratedConf() {
            assertThatCode(() -> provider.validateConfFileContents(agent, validConf))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("자유롭게 편집한 값(consumer group 등)은 허용한다")
        void allowsFreeEdits() {
            String edited = validConf.replace("fdt-consumer-group", "my-own-group")
                    .replace("latest", "earliest");

            assertThatCode(() -> provider.validateConfFileContents(agent, edited))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("agent 이름 prefix 를 바꾸면 거부한다")
        void rejectsChangedPrefix() {
            String edited = validConf.replace("kafkaAgent.", "renamed.");

            assertThatThrownBy(() -> provider.validateConfFileContents(agent, edited))
                    .isInstanceOf(AgentException.class)
                    .hasMessageContaining("prefix");
        }

        @Test
        @DisplayName("channel topic 을 DB 값과 다르게 바꾸면 거부한다")
        void rejectsChangedTopic() {
            String edited = validConf.replace(".kafka.topic = fdt_topic", ".kafka.topic = other_topic");

            assertThatThrownBy(() -> provider.validateConfFileContents(agent, edited))
                    .isInstanceOf(AgentException.class)
                    .hasMessageContaining("kafka.topic");
        }

        @Test
        @DisplayName("빈 내용은 거부한다")
        void rejectsEmpty() {
            assertThatThrownBy(() -> provider.validateConfFileContents(agent, "   "))
                    .isInstanceOf(AgentException.class);
        }
    }

    @Nested
    @DisplayName("HTTP 타입")
    class Http {

        private HttpConfFileProvider provider;
        private Agent agent;
        private String validConf;

        @BeforeEach
        void setUp() {
            provider = new HttpConfFileProvider();
            ReflectionTestUtils.setField(provider, "kafkaUrl", "pipeline-kafka-1:19092");

            AgentRequestDto requestDto = AgentRequestDto.builder()
                    .name("httpAgent")
                    .type(AgentType.HTTP)
                    .models(Collections.singletonList(new DataModelDto()))
                    .urlAddress("http://test/test.com")
                    .connTerm("10")
                    .method("GET")
                    .isCustomTopic(true)
                    .topic("http_topic")
                    .build();
            agent = HttpAgent.create(requestDto, "/opt/flume/conf/files/");
            agent.setTopic("http_topic");
            validConf = provider.getConfFileContents(agent, requestDto);
        }

        @Test
        @DisplayName("생성된 conf 는 그대로 통과한다")
        void acceptsGeneratedConf() {
            assertThatCode(() -> provider.validateConfFileContents(agent, validConf))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("AGENT_ID 를 지우면 거부한다 (상태 감시가 오작동하므로)")
        void rejectsMissingAgentId() {
            String edited = validConf.replace("httpAgent.sinks.sink_kafka.AGENT_ID = null\n", "");

            assertThatThrownBy(() -> provider.validateConfFileContents(agent, edited))
                    .isInstanceOf(AgentException.class)
                    .hasMessageContaining("AGENT_ID");
        }

        @Test
        @DisplayName("수집 주소나 주기는 자유롭게 편집할 수 있다")
        void allowsFreeEdits() {
            String edited = validConf.replace("CONN_TERM = 10", "CONN_TERM = 60");

            assertThatCode(() -> provider.validateConfFileContents(agent, edited))
                    .doesNotThrowAnyException();
        }
    }
}
