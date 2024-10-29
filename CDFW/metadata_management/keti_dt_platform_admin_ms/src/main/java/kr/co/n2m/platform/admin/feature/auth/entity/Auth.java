package kr.co.n2m.platform.admin.feature.auth.entity;

import java.time.LocalDateTime;


import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Id;
import javax.persistence.Table;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import io.swagger.annotations.ApiModel;
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
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
@Table(name="tb_com_auth")
@ApiModel(value = "권한")
public class Auth extends SearchAuth {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	/** 권한 Object ID. */
	@Id
	@ApiModelProperty(notes="권한 OID", example="0")
	@ApiParam(value="권한 OID")
	@Column(name="aut_oid")
	private String autOid;
	
	/** 권한 ID. */
	@ApiModelProperty(notes="권한 ID", example="0")
	@ApiParam(value="권한 ID")
	@Column(name="aut_id")
	private String autId;
	
	/** 권한명. */
	@ApiModelProperty(notes="권한 명", example="''")
	@ApiParam(value="권한 명")
	@Column(name="aut_nm")
	private String autName;
	
	/** 권한 설명 */
	@ApiModelProperty(notes="권한 설명", example="''")
	@ApiParam(value="권한 설명")
	@Column(name="aut_desc")
	private String autDesc;
	
	/** 플랫폼 아이디 */
	@ApiModelProperty(notes="플랫폼 아이디", example="''")
	@ApiParam(value="플랫폼 아이디")
	@Column(name="pltfrm_id")
	private String pltfrmId;
	
	/** 사용 여부 */
	@ApiModelProperty(notes="사용 여부", example="''")
	@ApiParam(value="사용 여부")
	@Column(name="use_yn")
	private String useYn;
	
	/** 유형 코드 */
	@ApiModelProperty(notes="유형 코드", example="''")
	@ApiParam(value="유형 코드")
	@Column(name="type_cd")
	private String typeCd;
	
	/** 등록 일시 */
	@ApiModelProperty(notes="등록 일시", example="''")
	@ApiParam(value="등록 일시")
	@CreatedDate
	@Column(name="reg_dt", updatable = false)
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
	@ApiModelProperty(notes = "수정 일시", example = "''")
	@ApiParam(value="수정 일시")
	@LastModifiedDate
	@Column(name="amd_dt", insertable = false)
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
	
	
}
