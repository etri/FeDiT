package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.zone.ZoneStateDto;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@Schema(description = "층에 대한 상세 정보 - 건물_랜딩 화면 (화면 중앙)")
public class FloorDetailsDto {

    @Schema(description = "층 이름")
    private String floorName;

    @Schema(description = "층을 구성하는 존에 대한 이름 및 상세 정보 (냉난방, 조명 ON/OFF, 공실/재실 등)")
    private List<ZoneStateDto> zoneInfoList;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "층 실시간 실쾌적도(= 존의 실시간 실쾌적도 평균치)")
    private String floorRealtimeComfortableLevel;

}
