package kr.co.e8ight.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.auth.entity.Member;
import kr.co.e8ight.auth.entity.common.RequestSecurityDto;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Setter @Getter
@ToString
public class JoinRequestDto implements RequestSecurityDto<Member> {

	@Schema(description = "멤버Id", example = "e8ight2810", required = true)
	@NotBlank(message = "아이디를 입력해 주세요. ")
	@Pattern(regexp = "^[A-Za-z[0-9]]{10,20}$", message = "아이디는 영문과 숫자로만 이루어 입력해 주세요.")
	@Size(min = 8, max = 12, message = "아이디는 8자이상 12자 이하로 입력해 주세요.")
	protected String memberId;

	@Schema(description = "패스워드", example = "hello28!2", required = true)
	@NotBlank(message = "패스워드를 입력해 주세요. ")
	@Pattern(regexp="^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[$@$!%*#?&])[A-Za-z[0-9]$@$!%*#?&]{8,20}$",
			message = "패스워드는 영문, 숫자, 특수문자를 사용하여 입력해 주세요.")
	@Size(min = 8, max = 10, message = "패스워드는 8자이상 10자 이하로 입력해 주세요.")
	private String passwd;

	@Schema(description = "이름", example = "홍길동", required = true)
	@NotBlank(message = "이름을 입력해주세요.")
	@Size(min = 2, max = 8, message = "이름 길이를 확인해 주세요.")
	private String name;

	@Schema(description = "이메일주소", example = "kdhong@e8ight.co.kr", required = true)
	@NotBlank(message = "이메일 주소를 입력해 주세요.")
	@Pattern(regexp = "^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$", message="이메일 형식을 확인해 주세요.")
	@Size(min=1, max=30, message="이메일 길이는 30자이내로 입력해 주세요.")
	private String email;

	@Schema(description = "휴대폰번호", example = "01055556666", required = true)
	@NotBlank(message = "휴대폰 번호를 입력해주세요.")
	@Size(min = 10, max = 11, message = "휴대폰 번호를 10~11자 사이로 입력해 주세요.")
	private String mbPhone;

	@Schema(description = "관리자여부", example = "true", required = true)
	private Boolean isAdmin = Boolean.FALSE;

	public JoinRequestDto() {
	}

	public JoinRequestDto(String memberId, String mbPhone, String name, String passwd) {
		this.memberId = memberId;
		this.mbPhone = mbPhone;
		this.name = name;
		this.passwd = passwd;
	}

	public JoinRequestDto(String memberId, String passwd) {
		this.memberId = memberId;
		this.passwd = passwd;
	}

	public void setPasswd(String passwd) {
		this.passwd = passwd;
	}

	@Override
	public Member toEntity(PasswordEncoder passwordEncoder) {
		return Member.builder()
			.memberId(memberId)
			.name(name)
			.passwd(passwordEncoder.encode(passwd))
			.hp(mbPhone)
			.build();
	}
}
