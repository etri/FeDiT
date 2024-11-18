package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.Map;

@NoArgsConstructor
@Getter
@ToString
public class ContextResponseDto {

    @JsonProperty("@context")
    private Map<String,String> context;
    private Boolean isReady;
}
