package kr.co.n2m.platform.admin.feature.auth.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.IdClass;
import javax.persistence.Table;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(AuthUser.class)
@EqualsAndHashCode(callSuper = false)
@Table(name="tb_com_authusermap")

public class AuthUser extends SearchAuth {

	private static final long serialVersionUID = 1L;

	/** 권한 Object ID. */
	@Id
	@ApiModelProperty(notes="권한 OID", example="0")
	@ApiParam(value = "권한 OID")
	@Column(name="aut_oid")
	private String autOid;
	
	/** 사용자 아이디. */	
	@Id
	@ApiModelProperty(notes="사용자 ID", example="0")
	@ApiParam(value = "사용자 ID")
	@Column(name="user_id")
	private String userid;
	
	/** 사용자 이름. */	
	@Id
	@ApiModelProperty(notes="사용자 이름", example="0")
	@ApiParam(value = "사용자 이름")
	@Column(name="nickname")
	private String nickname;
	
	/** 사용자 이메일. */	
	@Id
	@ApiModelProperty(notes="사용자 이메일", example="0")
	@ApiParam(value = "사용자 이메일")
	@Column(name="email")
	private String email;
	
	/** 사용자 전화번호. */	
	@Id
	@ApiModelProperty(notes="사용자 전화번호", example="0")
	@ApiParam(value = "사용자 전화번호")
	@Column(name="phone")
	private String phone;
	
}
