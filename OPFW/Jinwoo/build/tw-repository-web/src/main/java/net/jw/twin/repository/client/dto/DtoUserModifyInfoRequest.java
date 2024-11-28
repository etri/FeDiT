package net.jw.twin.repository.client.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Getter
@Setter
public class DtoUserModifyInfoRequest {
    @NotBlank(message = "이름을 입력해 주세요.")
    @Size(max=30, message = "이름을 30자 이하로 입력해 주세요.")
    private String userNm;
    @NotBlank(message = "이메일을 입력해 주세요.")
    @Email(message = "이메일 형식을 확인해 주세요.")
    private String email;
    @NotBlank(message = "연락처를 입력해 주세요.")
    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "연락처 형식을 확인해 주세요.")
    private String mobile;
}
