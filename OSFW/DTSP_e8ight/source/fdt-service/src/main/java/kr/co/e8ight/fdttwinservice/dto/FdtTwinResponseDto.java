package kr.co.e8ight.fdttwinservice.dto;


import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
@Builder
public class FdtTwinResponseDto {

    private String measure_position_name;

    private FdtTwinDto federation_data;

    private FileDto federation_3d_model;
}
