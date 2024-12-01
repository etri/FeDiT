package net.jw.twin.repository.client.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.*;

@Getter
@Setter
public class DtoPublicSignUpRequest {
    @NotBlank(message = "아이디를 입력해 주세요.")
    @Pattern(regexp = "^[a-z]+[a-z0-9]{3,19}$", message = "아이디를 영문자로 시작하는 영문자 또는 숫자 4~20자 로 입력해 주세요.")
    private String userLoginId;
    @Min(value=0, message = "회사 ID가 잘못되었습니다. 관리자에게 문의해 주세요.")
    @Max(value=65535, message = "회사 ID가 잘못되었습니다. 관리자에게 문의해 주세요.")
    private Long institutionId;
    @NotBlank(message = "비밀번호를 입력해 주세요.")
    @Size(max=200, message = "비밀번호를 200자 이하로 입력해 주세요.")
    private String userPwd;
    @NotBlank(message = "이름이 유효하지 않습니다. 관리자에게 문의해 주세요.")
    @Size(max=30, message = "이름이 유효하지 않습니다. 관리자에게 문의해 주세요.")
    private String userNm;
    @NotBlank(message = "이메일을 입력해 주세요.")
    @Email(message = "이메일 형식을 확인해 주세요.")
    private String email;
    @NotBlank(message = "연락처가 유효하지 않습니다. 관리자에게 문의해 주세요.")
    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "연락처가 유효하지 않습니다. 관리자에게 문의해 주세요.")
    private String mobile;
}
