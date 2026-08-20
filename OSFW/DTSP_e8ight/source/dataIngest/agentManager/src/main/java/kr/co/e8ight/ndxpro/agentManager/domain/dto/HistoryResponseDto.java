package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentHistory;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
public class HistoryResponseDto {
    @Schema(description = "History ID")
    private Long id;

    @Schema(description = "Agent ID")
    private Long agentId;

    @Schema(description = "Agent Name")
    private String agentName;

    @Schema(description = "Agent status")
    private AgentStatus agentStatus;

    @Schema(description = "Who")
    private String operatedBy;

    @Schema(description = "When")
    private LocalDateTime operatedAt;

    public static HistoryResponseDto of(AgentHistory agentHistory) {
        return HistoryResponseDto.builder()
                .id(agentHistory.getId())
                .agentId(agentHistory.getAgentId())
                .agentName(agentHistory.getAgentName())
                .agentStatus(agentHistory.getAgentStatus())
                .operatedBy(agentHistory.getOperatedBy())
                .operatedAt(agentHistory.getOperatedAt())
                .build();
    }
}
