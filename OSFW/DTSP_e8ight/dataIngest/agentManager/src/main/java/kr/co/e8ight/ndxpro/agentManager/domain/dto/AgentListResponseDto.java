package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AgentListResponseDto {
    @Schema(description = "Agent 리스트")
    private List<AgentResponseDto> data = new ArrayList<>();
    private Long totalData;
    private Integer totalPage;

    public AgentListResponseDto(Long totalData, Integer totalPage) {
        this.totalData = totalData;
        this.totalPage = totalPage;
    }
}
