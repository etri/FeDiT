package kr.co.e8ight.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

@AllArgsConstructor
@NoArgsConstructor
@Setter @Getter
@ToString
public class LoginRequestDto {
	@Schema(description = "멤버Id", example = "e8ight2810", required = true)
	@NotBlank(message = "Id를 입력하세요")
	private String memberId;

	@Schema(description = "패스워드", example = "hello28!2", required = true)
	@NotBlank(message = "패스워드를 입력해주세요.")
//	@Pattern(regexp="^(?=.*[A-Za-z])(?=.*\\d)(?=.*[$@$!%*#?&])[A-Za-z\\d$@$!%*#?&]{8,20}$", message = "")
	private String passwd;

}
