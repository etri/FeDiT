package kr.co.n2m.platform.admin.feature.user.entity;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Transient;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
//import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@ApiModel(value = "사용자")
@Entity
//@Builder
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "tb_com_user")
public class User extends SearchUser {

	/** 사용자 Object ID. */
	@ApiModelProperty(notes="사용자 OID", example= "1234")
	@ApiParam(value = "사용자 OID")
	@Id
	@Column(name = "user_oid")
	private String userOid;

	/** 사용자 ID. */
	@ApiModelProperty(notes="사용자 ID", example="1234")
	@ApiParam(value = "사용자 ID")
	@Column(name = "user_id")
	private String userId;

	/** 사용자 명. */
	@ApiModelProperty(notes="사용자 명", example="테스트 사용자")
	@ApiParam(value = "사용자 명")
	@Column(name = "user_nm")
	private String userName;

	/** 전화번호. */
	@ApiModelProperty(notes="사용자 전화번호", example="02-514-6123")
	@ApiParam(value = "사용자 전화번호")
	@Column(name = "tel_no")
	private String telNo;

	/** 이메일. */
	@ApiModelProperty(notes="이메일", example="n2m.co.kr")
	@ApiParam(value = "이메일")
	@Column(name = "email")
	private String email;

	/** 관리자 여부. */
	@ApiModelProperty(notes="관리자 여부", example="N")
	@ApiParam(value = "관리자 여부")
	@Column(name = "admr_yn")
	private String admrYn;

	/** 삭제 여부. */
	@ApiModelProperty(notes="삭제 여부", example="N")
	@ApiParam(value = "삭제 여부")
	@Column(name = "del_yn")
	private String delYn;

	/** 최종 로그인일시 */
	@ApiParam(value = "최종 로그인일시")
	@Column(name = "last_login_dt")
	private LocalDateTime lastLoginDt;

	/** 비밀번호 변경일시 */
	@ApiParam(value = "비밀번호 변경일시")
	@Column(name = "pwd_chg_dt")
	private LocalDateTime pwdChgDt;

	/** 등록 일시 */
	@ApiParam(value = "등록 일시")
	@CreatedDate
	@Column(name = "reg_dt", updatable = false)
	private LocalDateTime regDt;

	/** 등록자 ID*/
	@ApiModelProperty(notes = "등록자 id", example = "''")
	@ApiParam(value="등록자 id")
	@CreatedBy
	@Column(name="regr_id", updatable = false)
	private String regrId;
	
	/** 등록자 이름*/
	@ApiModelProperty(notes = "등록자 이름", example = "''")
	@ApiParam(value="등록자 이름")
	@CreatedBy
	@Column(name="regr_nm", updatable = false)
	private String regrNm;

	/** 수정 일시 */
	@ApiParam(value = "수정 일시")
	@LastModifiedDate
	@Column(name = "amd_dt", insertable = false)
	private LocalDateTime amdDt;

	/** 수정자 ID*/
	@ApiModelProperty(notes = "수정자 id", example = "''")
	@ApiParam(value="수정자 id")
	@LastModifiedBy
	@Column(name="amdr_id", insertable = false)
	private String amdrId;
	
	
	/** 수정자 이름*/
	@ApiModelProperty(notes = "수정자 이름", example = "''")
	@ApiParam(value="수정자 이름")
	@CreatedBy
	@Column(name="amdr_nm", insertable = false)
	private String amdrNm;
	
	@Transient
	private String autOid;

}
