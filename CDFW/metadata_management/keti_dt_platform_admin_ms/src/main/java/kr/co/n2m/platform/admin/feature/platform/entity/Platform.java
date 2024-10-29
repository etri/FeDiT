package kr.co.n2m.platform.admin.feature.platform.entity;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@ApiModel(value = "플랫폼")
@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tb_com_platform")
@EqualsAndHashCode(callSuper = false)
public class Platform extends SearchPlatform {

	private static final long serialVersionUID = 1748311680795165141L;

	/** 플랫폼 ID. */
	@Id
	@Column(name = "pltfrm_id")
	@ApiModelProperty(notes = "플랫폼 ID", example = "0")
	@ApiParam(value = "플랫폼 ID")
	private String pltfrmId;
	
	/** 플랫폼 명. */
	@ApiModelProperty(notes = "플랫폼 명", example = "''")
	@ApiParam(value="플랫폼 명")
	@Column(name="pltfrm_nm")
	private String pltfrmNm;
	
	/** 플랫폼 설명 */
	@ApiModelProperty(notes = "플랫폼 설명", example = "''")
	@ApiParam(value = "플랫폼 설명")
	@Column(name = "pltfrm_desc")
	private String pltfrmDesc;

	/** 사용 여부 */
	@ApiModelProperty(notes = "사용 여부", example = "''")
	@ApiParam(value = "사용 여부")
	@Column(name = "use_yn")
	private String useYn;
	
	/** 등록 일시 */
	@ApiModelProperty(notes = "등록 일시", example = "''")
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
	@ApiModelProperty(notes = "수정 일시", example = "''")
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
	
	/** 순서. */
	@ApiModelProperty(notes = "순서", example = "0")
	@ApiParam(value = "순서")
	@Column(name = "odrg")
	private Integer odrg;
	
	/** 주화면존재여부 */
	@ApiModelProperty(notes = "주화면존재여부", example = "N")
	@ApiParam(value = "주화면존재여부")
	@Column(name = "main_scrn_exist_yn")
	private String mainScrnExistYn;
	
}
