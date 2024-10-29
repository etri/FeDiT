package kr.co.n2m.platform.admin.feature.codegroup.entity;

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
import lombok.NoArgsConstructor;

@ApiModel(value="코드")
@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name="tb_com_code")
public class Code extends SearchCodegroupVO {

	/** 코드 ID. */
	@Id
	@Column(name="cd_id")
	@ApiModelProperty(notes="코드 ID", example= "12345")
	@ApiParam(value= "코드 ID")
	private String cdId;

	/** 코드그룹 ID. */
	@Column(name="cd_grp_id")
	@ApiModelProperty(notes="코드 그룹 ID", example= "111")
	@ApiParam(value= "코드 그룹 ID")
	private String grpId;

	/** 코드 명. */
	@Column(name="cd_nm")
	@ApiModelProperty(notes="코드명", example= "테스트")
	@ApiParam(value= "코드명")
	private String cdNm;

	/** 코드 값. */
	@Column(name="cd_val")
	@ApiModelProperty(notes="코드 값", example= "0")
	@ApiParam(value= "코드 값")
	private String cdVal;

	/** 설명. */
	@Column(name="cd_desc")
	@ApiModelProperty(notes="설명", example= "테스트용 입니다.")
	@ApiParam(value= "설명")
	private String cdDesc;

	/** 상위 코드명. */
	@Column(name="up_cd_id")
	@ApiModelProperty(notes="상위 코드 ID", example= "111")
	@ApiParam(value= "상위 코드 ID")
	private String upCdId;

	/** 사용 y:use *. */
	@Column(name="use_yn")
	@ApiModelProperty(notes="코드 그룹 사용여부", example= "Y")
	@ApiParam(value= "코드 그룹 사용여부")
	private String useYn;
	
	/** 순서. */
	@Column(name="odrg")
	@ApiModelProperty(notes="순서", example= "0")
	@ApiParam(value= "순서")
	private Integer odrg;

	/** 참조 코드. */
	@Column(name="ref_cd_nm")
	@ApiModelProperty(notes="참조 코드명", example= "12345")
	@ApiParam(value= "참조 코드명")
	private String refNm;

	@Column(name="ref_cd_val")
	@ApiModelProperty(notes="참조 코드 값", example= "0")
	@ApiParam(value= "참조 코드 값")
	private String refVal;
	
	/** 등록 일시 */
	@Column(name="reg_dt", updatable = false)
	@CreatedDate
	@ApiModelProperty(notes="등록 일시", example="''")
	@ApiParam(value="등록 일시")
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
	@Column(name="amd_dt", insertable = false)
	@LastModifiedDate
	@ApiModelProperty(notes="수정 일시", example="''")
	@ApiParam(value="수정 일시")
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
