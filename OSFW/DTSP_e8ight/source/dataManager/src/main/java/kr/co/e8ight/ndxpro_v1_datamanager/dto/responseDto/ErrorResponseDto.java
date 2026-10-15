package kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

/**
 * Swagger 문서용 오류 응답 스키마.
 * <p>
 * 실제 응답은 ndxpro_common 의 {@code ErrorResult} 가 그대로 내려가며, 이 클래스는 필드 설명/예시를 붙여
 * 문서에 노출하기 위한 용도로만 사용한다. 필드 구성은 {@code ErrorResult} 와 동일하게 유지해야 한다.
 */
@Getter
@Schema(name = "ErrorResponse", description = "오류 응답. HTTP 상태 코드와 함께 반환됩니다.")
public class ErrorResponseDto {

    @Schema(description = "오류 유형 URI", example = "http://uri.e8ight/ngsi-ld/erros/ResourceNotFound")
    private String type;

    @Schema(description = "오류 제목", example = "Resource Not Found")
    private String title;

    @Schema(description = "오류 상세 메시지 (원인이 되는 리소스 식별자 포함)", example = "Not Exists. DataModel= Building")
    private String detail;

    @Schema(description = "오류 코드<br>"
            + "1400: INVALID_REQUEST(400) / 2400: BAD_REQUEST_DATA(400) / 1404: RESOURCE_NOT_FOUND(404) / "
            + "1409: ALREADY_EXISTS(409) / 1422: OPERATION_NOT_SUPPORTED(422) / 1500: INTERNAL_SERVER_ERROR(500)",
            example = "1404")
    private int code;
}
