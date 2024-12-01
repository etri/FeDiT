package kr.co.e8ight.ndxpro.dataservice.dto.ean.maintenance;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@Schema(description = "유지보수 이력")
public class MaintenanceHistoryDto {

    @Schema(description = "유지보수 이력 ID", nullable = false, example = "1")
    private Integer maintenanceHistoryId;

    @Schema(description = "담당자", nullable = false, example = "홍길동")
    private String personInCharge;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
    @Schema(description = "유지보수 처리한 날짜", nullable = false, example = "2023-08-16", type = "string")
    private LocalDateTime creDate;

    @Schema(description = "비용", nullable = true, example = "1300000")
    private Integer cost;

    // TODO: 업로드 파일 시스템을 어떻게 구분하는지 확인 필요
    @Schema(description = "첨부파일명", nullable = false, example = "file.pdf")
    private String attachmentFilename;

}
