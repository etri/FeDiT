package kr.co.e8ight.auth.dto;


import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.Column;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Setter @Getter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PasswdResponseDto {

	@Id
	@GeneratedValue(strategy= GenerationType.IDENTITY)
	@Column(unique=true, nullable=false)
	private Integer id;

	@Column(nullable=false, length=50)
	protected String memberId;

	private String passwd;

	public PasswdResponseDto(Integer id, String memberId, String passwd) {
		this.id = id;
		this.memberId = memberId;
		this.passwd = passwd;
	}

}
