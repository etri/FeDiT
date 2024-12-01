package kr.co.e8ight.ndxpro.dataservice.dto.ean.facility;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "설비 속성 정보")
public class FacilityAttributeDto {

    @Schema(description = "설비 ID", nullable = false, example = "1")
    private Integer facilityId;

    // TODO: 설비 속성에 대한 상세한 필드명을 작성할지 아니면 property1, property2처럼 넘버링을 붙일지 고민할 것
    // TODO: 속성명 개수가 명확하게 파악이 된다면 상세한 필드명이 나을 것으로 보임

    @Schema(description = "설비 모드", nullable = false, example = "외기냉방")
    private String facilityMode;

    @Schema(description = "설비 풍량", nullable = false, example = "88")
    private Float facilityAirflow;

    @Schema(description = "설비 설정온도", nullable = false, example = "88")
    private Float facilitySettingTemperature;

}
