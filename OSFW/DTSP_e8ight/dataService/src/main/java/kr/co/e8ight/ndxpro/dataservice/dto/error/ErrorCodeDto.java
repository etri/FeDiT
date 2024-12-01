package kr.co.e8ight.ndxpro.dataservice.dto.error;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@Schema
public class ErrorCodeDto {

    @Schema(description = "에러 제목", nullable = false, example = "Bad Request Data")
    private String title;

    @Schema(description = "에러 타입", nullable = false, example = "http://uri.e8ight/ngsi-ld/erros/BadRequestData")
    private String type;

    @Schema(description = "에러 코드", nullable = false, example = "2400")
    private int code;

    @Schema(description = "에러 상태", nullable = false, example = "400 BAD_REQUEST")
    private HttpStatus status;

}
