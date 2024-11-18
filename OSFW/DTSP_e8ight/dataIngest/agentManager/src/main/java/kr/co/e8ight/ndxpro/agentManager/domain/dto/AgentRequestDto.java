package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentType;
import lombok.*;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@ToString
@Builder
public class AgentRequestDto {

    @NotEmpty(message = "Agent name Required.")
    @Schema(description = "Agent에 설정할 이름", example = "demo")
    private String name;

    @NotNull(message = "Agent type Required.")
    @Schema(description = "Agent의 타입 (HTTP)", example = "HTTP")
    private AgentType type;

    @NotEmpty(message = "Model info Required.")
    @Schema(description = "Agent가 수집할 데이터의 모델 정보 배열", example = "[{\"modelType\" : \"Vehicle\", \"context\" : \"http://172.16.28.220:3005/e8ight-context-v1.01.jsonld\"}]")
    private List<DataModelDto> models;

    @NotEmpty(message = "URL Required.")
    @Schema(description = "Agent가 데이터를 수집할 주소" ,example = "http://1.233.183.202:51002")
    private String urlAddress;

    @NotEmpty(message = "Connection Term seconds Required.")
    @Schema(description = "수집 주기 (seconds)", example = "1", defaultValue = "60")
    private String connTerm;

    @NotEmpty(message = "HTTP Method Required.")
    @Schema(description = "Http Method", example = "GET", defaultValue = "GET")
    private String method;

    @Schema(description = "Http request body")
    private String body;

    @NotNull(message = "Custom Topic status Required.")
    @Schema(description = "Target Topic 사용자 설정 여부", example = "true")
    private Boolean isCustomTopic;

    @Schema(description = "target topic name", example = "dev.pintel.simul.org.vehicle.json")
    private String topic;
}
