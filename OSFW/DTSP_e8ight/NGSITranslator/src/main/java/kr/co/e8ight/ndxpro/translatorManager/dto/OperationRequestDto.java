package kr.co.e8ight.ndxpro.translatorManager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Schema(description = "Translator 실행,중지,재실행 요청 데이터")
public class OperationRequestDto {
    @NotEmpty(message = "Operation type Required.")
    @Schema(description = "Operation 타입", example = "run")
    String operation;
}
