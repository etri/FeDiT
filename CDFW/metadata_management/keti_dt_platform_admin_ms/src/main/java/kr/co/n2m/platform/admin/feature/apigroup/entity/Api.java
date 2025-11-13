package kr.co.n2m.platform.admin.feature.apigroup.entity;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Table(name = "tb_com_api")
public class Api extends SearchApigroup {

	private static final long serialVersionUID = 3733785335885881139L;

	/** API Object ID. */
	@Id
	@ApiModelProperty(notes = "API OID", example = "0")
	@ApiParam(value = "API OID")
	@Column(name = "api_oid")
	private String apiOid;
	
	/** API 그룹 Object ID. */
	@ApiModelProperty(notes = "API 그룹 OID", example = "0")
	@ApiParam(value = "API 그룹 OID")
	@Column(name = "api_grp_oid")
	private String grpOid;
	
	/** API명. */
	@ApiModelProperty(notes = "API명", example = "''")
	@ApiParam(value = "API명")
	@Column(name = "api_nm")
	private String apiName;
	
	/** API 설명. */
	@ApiModelProperty(notes = "API 설명", example = "''")
	@ApiParam(value = "API 설명")
	@Column(name = "api_desc")
	private String apiDesc;
	
	/** API URL. */
	@ApiModelProperty(notes = "API URL", example = "''")
	@ApiParam(value = "API URL")
	@Column(name = "api_url")
	private String apiUrl;
	
	/** 메소드 코드. */
	@ApiModelProperty(notes = "메소드 코드", example = "''")
	@ApiParam(value = "메소드 코드")
	@Column(name = "mthd_cd")
	private String mthdCd;
	
	/** 사용 여부. */
	@ApiModelProperty(notes = "사용 여부", example = "''")
	@ApiParam(value = "사용 여부")
	@Column(name = "use_yn")
	private String useYn;
	
	/** 등록 일시 */
	@ApiModelProperty(notes = "등록 일시", example = "''")
	@ApiParam(value="등록 일시")
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



