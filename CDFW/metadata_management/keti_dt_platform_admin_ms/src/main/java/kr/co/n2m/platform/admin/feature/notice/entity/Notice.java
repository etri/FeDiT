package kr.co.n2m.platform.admin.feature.notice.entity;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Convert;
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
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@ApiModel(value = "공지사항")
@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Table(name = "tb_com_notice")
public class Notice extends SearchNotice {

	private static final long serialVersionUID = -6028958924519818068L;

	/** 공지사항 Object ID. */
	@Id
	@Column(name = "ntf_oid")
	@ApiModelProperty(notes = "공지사항 OID", example="0")
	@ApiParam(value = "공지사항 OID")
	private String ntfOid;

	/** 공지사항 제목. */
	@Column(name = "ntf_title")
	@ApiModelProperty(notes = "공지사항 제목", example = "''")
	@ApiParam(value = "공지사항 제목")
	private String ntfTitle;

	/** 공지사항 내용. */
	@Column(name = "ntf_sbst")
	@ApiModelProperty(notes = "공지사항 내용", example = "''")
	@ApiParam(value = "공지사항 내용")
	private String ntfSbst;

	/** 조회수. */
	@Column(name = "retv_num")
	@ApiModelProperty(notes = "조회수", example = "0")
	@ApiParam(value = "조회수")
	private Integer retvNum;

	/** 관리자 공지 여부. */
	@Column(name = "adm_prsn_ntf_yn")
	@ApiModelProperty(notes = "관리자 공지 여부", example = "''")
	@ApiParam(value = "관리자 공지 여부")
	private String admPrsnNtfYn;

	/** 선 공지 여부. */
	@Column(name = "prev_ntf_yn")
	@ApiModelProperty(notes = "선 공지 여부", example = "''")
	@ApiParam(value = "선 공지 여부")
	private String prevNtfYn;
	
	/** 주요 팝업 여부. */
	@Column(name = "main_popup_yn")
	@ApiModelProperty(notes = "주요 팝업 여부", example = "''")
	@ApiParam(value = "주요 팝업 여부")
	private String mainPopupYn;
	
	/** 플랫폼 아이디 */
	@ApiModelProperty(notes = "플랫폼 아이디", example = "''")
	@ApiParam(value="플랫폼 아이디")
	@Column(name="pltfrm_id")
	private String pltfrmId;
	
	/** 팝업 시작 일시. */
	@ApiModelProperty(notes = "팝업 시작 일시", example = "''")
	@ApiParam(value = "팝업 시작 일시")
	@Convert(converter = StringUtil.class, attributeName = "popupStDt")
	@Column(name = "popup_st_dt")
	private LocalDateTime popupStDt;

	/** 팝업 종료 일시. */
	@ApiModelProperty(notes = "팝업 종료 일시", example = "''")
	@ApiParam(value = "팝업 종료 일시")
	@Convert(converter = StringUtil.class, attributeName = "popupFnsDt")
	@Column(name = "popup_fns_dt")
	private LocalDateTime popupFnsDt;
	
	/** 닫기 버튼 표시 여부. */
	@Column(name = "cls_butt_indc_yn")
	@ApiModelProperty(notes = "닫기 버튼 표시 여부", example = "''")
	@ApiParam(value = "닫기 버튼 표시 여부")
	private String clsButtIndcYn;
	
	/** 금일 팝업 표시 여부. */
	@Column(name = "today_popup_indc_yn")
	@ApiModelProperty(notes = "금일 팝업 표시 여부", example = "''")
	@ApiParam(value = "금일 팝업 표시 여부")
	private String todayPopupIndcYn;

	/** 팝업 가로 */
	@Column(name = "popup_wdth")
	@ApiModelProperty(notes="팝업 가로", example = "''")
	@ApiParam(value="팝업 가로", example = "0")
	private Integer popupWdth;

	/** 팝업 높이 */
	@Column(name = "popup_hght")
	@ApiModelProperty(notes="팝업 높이", example = "''")
	@ApiParam(value="팝업 높이")
	private Integer popupHght;

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
	@ApiModelProperty(notes="수정 일시", example="''")
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

}
