package kr.co.e8ight.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Setter @Getter
@NoArgsConstructor
@ToString
public class MemberDto {

    @Schema(description = "멤버Id", example = "e8ight2810", required = true)
    @NotBlank(message = "아이디를 입력해 주세요. ")
    @Pattern(regexp = "^[A-Za-z[0-9]]{10,20}$", message = "아이디는 영문과 숫자로만 이루어 입력해 주세요.")
    @Size(min = 8, max = 12, message = "아이디는 8자이상 12자 이하로 입력해 주세요.")
    protected String memberId;

    @Schema(description = "이메일주소", example = "kdhong@e8ight.co.kr", required = true)
    @NotBlank(message = "이메일 주소를 입력해 주세요.")
    @Pattern(regexp = "^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$", message="이메일 형식을 확인해 주세요.")
    @Size(min=1, max=30, message="이메일 길이는 30자이내로 입력해 주세요.")
    private String email;

    @Schema(description = "휴대폰번호", example = "01055556666", required = true)
    @NotBlank(message = "휴대폰 번호를 입력해주세요.")
    @Size(min = 10, max = 11, message = "휴대폰 번호를 10~11자 사이로 입력해 주세요.")
    private String mbPhone;
}
