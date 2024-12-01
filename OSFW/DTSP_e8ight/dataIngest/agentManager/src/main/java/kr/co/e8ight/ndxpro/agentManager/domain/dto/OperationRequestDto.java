package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.agentManager.domain.JsonField;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;
import java.util.Map;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class OperationRequestDto {

    @NotEmpty(message = "Operation type Required.")
    @Schema(description = "Operation 타입", example = "run")
    String operation;

    @Schema(description = "Operation 타입", example = "run")
    Map<String , JsonField> bodyInfo;

    public OperationRequestDto(String operation) {
        this.operation = operation;
    }
}
