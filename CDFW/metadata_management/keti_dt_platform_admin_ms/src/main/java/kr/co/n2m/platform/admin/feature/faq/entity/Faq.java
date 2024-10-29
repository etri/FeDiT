package kr.co.n2m.platform.admin.feature.faq.entity;

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

@ApiModel(value = "FAQ")
@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Table(name = "tb_com_faq")
public class Faq extends SearchFaq {

	private static final long serialVersionUID = -6376946541550023390L;

	/** FAQ Object ID. */
	@Id
	@ApiModelProperty(notes = "FAQ OID", example = "0")
	@ApiParam(value = "FAQ OID")
	@Column(name = "faq_oid")
	private String faqOid;
	
	/** FAQ 제목. */
	@ApiModelProperty(notes = "FAQ 제목", example = "''")
	@ApiParam(value = "FAQ 제목")
	@Column(name = "faq_title")
	private String faqTitle;
	
	/** FAQ 질문. */
	@ApiModelProperty(notes = "FAQ 질문", example = "''")
	@ApiParam(value = "FAQ 질문")
	@Column(name = "faq_qstn")
	private String faqQstn;
	
	/** FAQ 답변. */
	@ApiModelProperty(notes = "FAQ 답변", example = "''")
	@ApiParam(value = "FAQ 답변")
	@Column(name = "faq_ans")
	private String faqAns;
	
	/** 플랫폼 아이디 */
	@ApiModelProperty(notes = "플랫폼 아이디", example = "''")
	@ApiParam(value="플랫폼 아이디")
	@Column(name="pltfrm_id")
	private String pltfrmId;
	
	/** 조회수. */
	@Column(name = "retv_num")
	@ApiModelProperty(notes = "조회수", example = "0")
	@ApiParam(value = "조회수")
	private Integer retvNum;
	
	/** 등록 일시. */
	@ApiModelProperty(notes = "faq 등록 일시", example = "''")
	@ApiParam(value = "faq 등록 일시")
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
	
	/** 수정 일시. */
	@ApiModelProperty(notes = "faq 수정 일시", example = "''")
	@ApiParam(value = "faq 수정 일시")
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
	

}
