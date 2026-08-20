package kr.co.e8ight.ndxpro.translatorManager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "빌드/컴파일 프로세스 관련 응답 데이터")
public class ProcessResultDto {
    @Schema(description = "프로세스 종료 코드")
    private Integer exitCode;

    @Schema(description = "프로세스 표준 출력")
    private String output;

    @Schema(description = "프로세스 표준 오류")
    private String error;

    @Schema(description = "파일 경로")
    private String savedFilePath;

    @Schema(description = "파일 바이트")
    private byte[] savedFile;
}
