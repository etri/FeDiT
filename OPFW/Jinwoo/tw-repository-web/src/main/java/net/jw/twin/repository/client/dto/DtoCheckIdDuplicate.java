package net.jw.twin.repository.client.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Getter
@Setter
public class DtoCheckIdDuplicate {
    @NotBlank(message = "아이디를 입력해 주세요.")
    @Pattern(regexp = "^[a-z]+[a-z0-9]{3,19}$", message = "아이디를 영문자로 시작하는 영문자 또는 숫자 4~20자 로 입력해 주세요.")
    private String userLoginId;
}
