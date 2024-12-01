package net.jw.twin.tw_service_manager.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(requiredProperties = {"service_id", "rest_key"})
public class DtoUsageRequest {
    @Schema(description = "data_item 테이블의 service_id", example = "data1")
    @NotNull(message="service_id 값이 null 입니다.")
    public String serviceId;
    @Schema(description = "rest_key 테이블의 token", example = "xxx...")
    @NotNull(message="rest_key 값이 null 입니다.")
    public String restKey;
    public String test;
}
