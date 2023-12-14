package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentType;
import kr.co.e8ight.ndxpro.agentManager.domain.HttpAgent;
import kr.co.e8ight.ndxpro.agentManager.domain.HttpsAgent;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AgentResponseDto {

    @Schema(description = "Agent ID")
    private Long id;

    @Schema(description = "Agent 이름")
    private String name;

    @Schema(description = "Agent의 현재 상태")
    private AgentStatus status;

    @Schema(description = "Agent type")
    private AgentType type;

    @Schema(description = "Agent type")
    private List<DataModelDto> models;

    @Schema(description = "Agent 프로세스의 pid")
    private Long pid;

    @Schema(description = "Agent 마지막 source 신호")
    private LocalDateTime lastSourceSignalReceivedAt;

    @Schema(description = "Agent 마지막 sink 신호")
    private LocalDateTime lastSinkSignalReceivedAt;

    @Schema(description = "Agent conf file 내용")
    private String confFileContents;

    @Schema(description = "Target Topic 사용자 설정 여부")
    private Boolean isCustomTopic;

    @Schema(description = "Agent kafka target topic")
    private String topic;

    @Schema(description = "Agent가 데이터를 수집할 주소")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Setter
    private String urlAddress;

    @Schema(description = "수집 주기 (seconds)")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Setter
    private String connTerm;

    @Schema(description = "Http Method")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Setter
    private String method;

    @Schema(description = "Http request body")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Setter
    private String body;

    public AgentResponseDto(Long id, String name, AgentStatus status, AgentType type, List<DataModelDto> models, Long pid, LocalDateTime lastSourceSignalReceivedAt, LocalDateTime lastSinkSignalReceivedAt, String confFileContents, Boolean isCustomTopic, String topic) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.type = type;
        this.models = models;
        this.pid = pid;
        this.lastSourceSignalReceivedAt = lastSourceSignalReceivedAt;
        this.lastSinkSignalReceivedAt = lastSinkSignalReceivedAt;
        this.confFileContents = confFileContents;
        this.isCustomTopic = isCustomTopic;
        this.topic = topic;
    }

    public AgentResponseDto(Long id) {
        this.id = id;
    }

    public static AgentResponseDto from(Agent agent) {
        return from(agent, null);
    }

    public static AgentResponseDto from(Agent agent, String confFileContents) {
        AgentResponseDto agentResponseDto = new AgentResponseDto(
                agent.getId(),
                agent.getName(),
                agent.getStatus(),
                agent.getType(),
                DataModelDto.of(agent.getDataModels()),
                agent.getPid(),
                agent.getLastSourceSignalDatetime(),
                agent.getLastSinkSignalDatetime(),
                confFileContents,
                agent.getIsCustomTopic(),
                agent.getTopic());

        if ( agent instanceof HttpAgent) {
            HttpAgent httpAgent = (HttpAgent) agent;
            agentResponseDto.setConnTerm(httpAgent.getConnTerm());
            agentResponseDto.setUrlAddress(httpAgent.getUrlAddress());
            agentResponseDto.setMethod(httpAgent.getMethod());
            agentResponseDto.setBody(httpAgent.getBody());
        } else if ( agent instanceof HttpsAgent) {
            HttpsAgent httpsAgent = (HttpsAgent) agent;
            agentResponseDto.setConnTerm(httpsAgent.getConnTerm());
            agentResponseDto.setUrlAddress(httpsAgent.getUrlAddress());
            agentResponseDto.setMethod(httpsAgent.getMethod());
            agentResponseDto.setBody(httpsAgent.getBody());
        }

        return agentResponseDto;
    }
}
