package kr.co.e8ight.ndxpro.agentManager.domain;

import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.persistence.Entity;
import javax.persistence.Table;
import java.util.ArrayList;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "kafka_agent_info", schema = "agent_manager")
public class KafkaAgent extends Agent {

    /** 수집 대상 Kafka 의 bootstrap servers */
    private String urlAddress;

    /** 수집 대상 Kafka 의 topic */
    private String sourceTopic;

    public KafkaAgent(AgentRequestDto requestDto, String configPath) {
        super(null, requestDto.getName(),
                requestDto.getType(),
                new ArrayList<>(),
                AgentStatus.CREATED,
                configPath,
                null,
                null,
                requestDto.getIsCustomTopic(),
                requestDto.getTopic(),
                null,
                null,
                null,
                null,
                false);
        this.urlAddress = requestDto.getUrlAddress();
        this.sourceTopic = requestDto.getSourceTopic();
    }

    public static KafkaAgent create(AgentRequestDto requestDto, String configPath) {
        return new KafkaAgent(requestDto, configPath);
    }

    public void update(AgentRequestDto requestDto) {
        super.update(requestDto);
        this.urlAddress = requestDto.getUrlAddress();
        this.sourceTopic = requestDto.getSourceTopic();
    }
}
