package kr.co.n2m.platform.admin.feature.img.entity;

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
@Table(name="tb_com_image")
@ApiModel(value="이미지 관리")
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class Img extends SearchImgVO {

	/** 이미지 OID */
	@Id
	@Column(name="img_oid")
	@ApiModelProperty(notes="이미지 OID", example= "1")
    @ApiParam(value= "이미지 OID")
	private String imgOid;

	/** 이미지 명 */
	@Column(name="img_nm")
	@ApiModelProperty(notes="이미지 명", example= "테스트 이미지")
    @ApiParam(value= "이미지 명")
	private String imgNm;

	/** 이미지 코드 */
	@Column(name="img_lnyd_nm")
	@ApiModelProperty(notes="이미지 설명", example= "테스트 이미지입니다.")
    @ApiParam(value= "이미지 설명")
	private String imgLnydNm;
	
	/** 플랫폼 아이디 */
	@ApiModelProperty(notes = "플랫폼 아이디", example = "''")
	@ApiParam(value="플랫폼 아이디")
	@Column(name="pltfrm_id")
	private String pltfrmId;
	
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
	
	@Transient
	private String fileOriginNm;
	
	@Transient
	private String fileRestoNm;
	
	@Transient
	private String fileRestoPath;


}
