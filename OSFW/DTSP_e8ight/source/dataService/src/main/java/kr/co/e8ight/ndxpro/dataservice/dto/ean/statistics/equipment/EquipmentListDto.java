package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.equipment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "설비 목록 - 설비_랜딩 화면 (좌측 하단)")
public class EquipmentListDto {

    @Schema(description = "설비 목록 JSON")
    private String equipmentListJson;

    @Schema(description = "설비명")
    private String equipmentName;

}
