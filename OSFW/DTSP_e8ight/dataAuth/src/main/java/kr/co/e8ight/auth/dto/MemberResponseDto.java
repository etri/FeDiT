package kr.co.e8ight.auth.dto;


import com.fasterxml.jackson.annotation.JsonInclude;
import kr.co.e8ight.auth.type.ApproveLevel;
import kr.co.e8ight.auth.type.AuthType;
import kr.co.e8ight.auth.type.MemberStatus;
import kr.co.e8ight.auth.util.CryptoUtil;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.modelmapper.ModelMapper;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 
 * 로그인, 로그아웃, 아이디찾기, 비번찾기, 회원탈퇴에 사용
 */

@ToString
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MemberResponseDto {

	private Integer id;

	protected String memberId;

	protected String name;

	private String hp;	
	
	private AuthType authType;

	private MemberStatus status;

	private String email;

	private LocalDateTime createAt;
	
	private LocalDateTime lastAccessDt;

	private ApproveLevel approveLevel;

	public MemberResponseDto(Integer id, String memberId) {
		this.id = id;
		this.memberId = memberId;
	}

	public String getHp() {
		return ( this.hp == null ) ? null: CryptoUtil.ase256DecodeDefaultVal(this.hp);
	}

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public String getMemberId() {
		return memberId;
	}

	public void setMemberId(String memberId) {
		this.memberId = memberId;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public void setHp(String hp) {
		this.hp = hp;
	}

	public AuthType getAuthType() {
		return authType;
	}

	public void setAuthType(AuthType authType) {
		this.authType = authType;
	}

	public MemberStatus getStatus() {
		return status;
	}

	public void setStatus(MemberStatus status) {
		this.status = status;
	}

	public LocalDateTime getLastAccessDt() {
		return lastAccessDt;
	}

	public void setLastAccessDt(LocalDateTime lastAccessDt) {
		this.lastAccessDt = lastAccessDt;
	}

	public ApproveLevel getApproveLevel() {
		return approveLevel;
	}

	public void setApproveLevel(ApproveLevel approveLevel) {
		this.approveLevel = approveLevel;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public LocalDateTime getCreateAt() {
		return createAt;
	}

	public void setCreateAt(LocalDateTime createAt) {
		this.createAt = createAt;
	}
}
