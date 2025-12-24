package kr.co.n2m.platform.admin.feature.qna.entity;

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

@ApiModel(value = "QNA")
@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Table(name = "tb_com_qna")
public class Qna extends SearchQna {

	private static final long serialVersionUID = -640165001789241225L;

	/** QNA Object ID. */
	@Id
	@ApiModelProperty(notes = "QNA OID", example = "0")
	@ApiParam(value = "QNA OID")
	@Column(name = "qna_oid")
	private String qnaOid;
	
	/** QNA 제목. */
	@ApiModelProperty(notes = "QNA 제목", example = "''")
	@ApiParam(value = "QNA 제목")
	@Column(name = "qna_title")
	private String qnaTitle;
	
	/** QNA 질문. */
	@ApiModelProperty(notes = "QNA 질문", example = "''")
	@ApiParam(value = "QNA 질문")
	@Column(name = "qna_qstn")
	private String qnaQstn;
	
	/** QNA 답변. */
	@ApiModelProperty(notes = "QNA 답변", example = "''")
	@ApiParam(value = "QNA 답변")
	@Column(name = "qna_ans")
	private String qnaAns;
	
	/** 플랫폼 아이디 */
	@ApiModelProperty(notes = "플랫폼 아이디", example = "''")
	@ApiParam(value="플랫폼 아이디")
	@Column(name="pltfrm_id")
	private String pltfrmId;
	
	/** 공개 여부. */
	@ApiModelProperty(notes = "공개 여부", example = "''")
	@ApiParam(value = "공개 여부")
	@Column(name = "ottp_yn")
	private String ottpYn;
	
	/** 상태 코드. */
	@ApiModelProperty(notes = "상태 코드", example = "''")
	@ApiParam(value = "상태 코드")
	@Column(name = "sttus_cd")
	private String sttusCd;
	
	/** 조회수. */
	@ApiModelProperty(notes = "조회수", example = "0")
	@ApiParam(value = "조회수")
	@Column(name = "retv_num")
	private Integer retvNum;
	
	/** QNA 등록 일시. */
	@ApiModelProperty(notes = "QNA 등록 일시", example = "''")
	@ApiParam(value = "QNA 등록 일시")
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
	
	/** QNA 수정 일시. */
	@ApiModelProperty(notes = "QNA 수정 일시", example = "''")
	@ApiParam(value = "QNA 수정 일시")
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
	

	/** QNA 답변 등록 일시. */
	@ApiModelProperty(notes = "QNA 답변 등록 일시", example = "''")
	@ApiParam(value="QNA 답변 등록 일시")
	@CreatedDate
	@Column(name="reg_dt2", insertable = false)
	private LocalDateTime regDt2;
	
	/** QNA 답변 ID. */
	@ApiModelProperty(notes = "등록자 id", example = "''")
	@ApiParam(value="등록자 id")
	@CreatedBy
	@Column(name="regr2_id", insertable = false)
	private String regr2Id;
	
	/** QNA 답변 이름. */
	@ApiModelProperty(notes = "등록자 이름", example = "''")
	@ApiParam(value="등록자 이름")
	@CreatedBy
	@Column(name="regr2_nm", insertable = false)
	private String regr2Nm;
	
}
