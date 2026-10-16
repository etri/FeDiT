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
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="tb_com_codegroup")
@ApiModel(value="코드 그룹")
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class Codegroup extends SearchCodegroupVO  {

	/** 코드 그룹 ID. */
	@Id
	@Column(name="cd_grp_id")
	@ApiModelProperty(notes="코드 그룹 ID", example= "12345")
    @ApiParam(value= "코드 그룹 ID")
	private String grpId;

	/** 코드 그룹 명. */
	@Column(name="cd_grp_nm")
	@ApiModelProperty(notes="코드 그룹명", example= "테스트")
    @ApiParam(value= "코드 그룹명")
	private String grpNm;

	/** 코드 그룹 값. */
	@Column(name="cd_grp_val")
	@ApiModelProperty(notes="코드 그룹 값", example= "12345")
	@ApiParam(value= "코드 그룹 값")
	private String grpVal;
	
	/** 설명. */
	@Column(name="cd_grp_desc")
	@ApiModelProperty(notes="설명", example= "테스트입니다.")
    @ApiParam(value= "설명")
	private String grpDesc;
	
	/** 상위 코드명. */
	@Column(name="up_cd_grp_id")
	@ApiModelProperty(notes="상위 코드명", example= "1234")
    @ApiParam(value= "상위 코드명")
	private String upCdGrpId;

	/** 사용 y:use *. */
	@Column(name="use_yn")
	@ApiModelProperty(notes="코드 그룹 사용여부", example= "Y")
    @ApiParam(value= "코드 그룹 사용여부")
	private String useYn;
	
	/** 플랫폼 ID */
	@Column(name = "pltfrm_id")
	@ApiModelProperty(notes="플랫폼 ID", example="null")
	@ApiParam(value = "플랫폼 ID")
	private String pltfrmId;
	
	/** 코드 유형 */
	@Column(name = "cd_type")
	@ApiModelProperty(notes="코드 유형", example="null")
	@ApiParam(value = "코드 유형")
	private String cdType;

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
