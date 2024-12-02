package net.jw.twin.tw_service_manager.rest.springDoc.schema;

import com.google.gson.annotations.Expose;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Response500 {
    @Expose
    @Schema(description = "exception uuid", example = "817f2e35-a9a5-44bf-82ec-54db484ca39a")
    private String uuid;
    @Expose
    @Schema(description = "백엔드에서 지정한 errorStatus", example = "UNKNOWN")
    private String errorStatus;
    @Expose
    @Schema(description = "백엔드에서 프론트로 보내는 에러 메시지", example = "알수 없는 오류가 발생하였습니다.")
    private String msg;
}
