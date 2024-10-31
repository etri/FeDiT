package net.jw.twin.repository.client.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Getter
@Setter
public class DtoUserModifyPwdRequest {
    @NotBlank(message = "현재 비밀번호를 입력해 주세요.")
    @Size(max=200, message = "현재 비밀번호를 200자 이하로 입력해 주세요.")
    private String currentPwd;
    @NotBlank(message = "새 비밀번호를 입력해 주세요.")
    @Size(max=200, message = "새 비밀번호를 200자 이하로 입력해 주세요.")
    private String newPwd;
}
