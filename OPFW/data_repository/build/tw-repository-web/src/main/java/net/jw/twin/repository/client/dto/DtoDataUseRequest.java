package net.jw.twin.repository.client.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.*;

@Getter
@Setter
public class DtoDataUseRequest {
    @NotNull(message = "데이터 ID가 유효하지 않습니다. 관리자에게 문의해 주세요.")
    @Min(value=0, message = "데이터 ID의 범위가 유효하지 않습니다. 관리자에게 문의해 주세요.")
    @Max(value=Long.MAX_VALUE, message = "데이터 ID의 범위가 유효하지 않습니다. 관리자에게 문의해 주세요.")
    private Long dataId;
    @NotNull(message = "사용목적을 입력해 주세요.")
    @Size(max=2000, message = "사용목적을 2000자 이하로 입력해 주세요.")
    private String purpose;
}
