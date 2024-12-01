package kr.co.e8ight.ndxpro.dataservice.dto.ean.facility;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "설비 목록")
public class FacilityDto {

    // TODO: 설비 간에 부모, 자식 관계를 가지고 있는 설비들을 어떤 관계로 매핑할지 고민할 것

    @Schema(description = "설비 ID", nullable = false, example = "1")
    private Integer facilityId;

    @Schema(description = "설비명", nullable = false, example = "Mixer_0")
    private String facilityName;

    @Schema(description = "태그명", nullable = true, example = "Tag")
    private String tagName; // 필요없는 값일 수도 있음

}
