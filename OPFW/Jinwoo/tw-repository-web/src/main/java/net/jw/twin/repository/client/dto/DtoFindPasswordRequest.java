package net.jw.twin.repository.client.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Getter
@Setter
public class DtoFindPasswordRequest {
    @NotBlank(message = "아이디를 입력해 주세요.")
    @Size(max=30, message = "아이디를 30자 이하로 입력해 주세요.")
    private String userLoginId;
}
