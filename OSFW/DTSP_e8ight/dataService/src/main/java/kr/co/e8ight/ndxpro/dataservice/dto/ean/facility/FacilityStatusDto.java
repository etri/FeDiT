package kr.co.e8ight.ndxpro.dataservice.dto.ean.facility;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "실시간 시스템 부하율")
public class FacilityStatusDto {

    @Schema(description = "설비 ID", nullable = false, example = "1")
    private Integer facilityId;

    @Schema(description = "설비명", nullable = false, example = "냉열원")
    private String facilityName;

    @Schema(description = "실시간 부하율", nullable = false, example = "56")
    private float realtimeLoadRate;

}
