package kr.co.n2m.platform.admin.feature.board.entity;

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
@Table(name="tb_com_bbsposting")
@ApiModel(value="게시글 관리")
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class BoardPosting extends SearchBoardVO {

	/** 게시 OID */
	@Id
	@Column(name="pstng_oid")
	@ApiModelProperty(notes="게시 OID", example= "1")
    @ApiParam(value= "게시 OID")
	private String pstngOid;
	
	/** 게시판 OID */
	@Column(name="bbs_oid")
	@ApiModelProperty(notes="게시판 OID", example= "1")
    @ApiParam(value= "게시판 OID")
	private String bbsOid;

	/** 게시 제목 */
	@Column(name="pstng_title")
	@ApiModelProperty(notes="게시 제목", example= "테스트 게시글")
    @ApiParam(value= "게시 제목")
	private String pstngTitle;
	
	/** 게시 내용 */
	@Column(name="pstng_sbst")
	@ApiModelProperty(notes="게시 내용", example= "테스트 게시글입니다.")
    @ApiParam(value= "게시 내용")
	private String pstngSbst;
	
	/** 플랫폼 아이디 */
	@ApiModelProperty(notes = "플랫폼 아이디", example = "''")
	@ApiParam(value="플랫폼 아이디")
	@Column(name="pltfrm_id")
	private String pltfrmId;
	
	/** 조회수 */
	@Column(name="retv_num")
	@ApiModelProperty(notes="조회수", example= "0")
    @ApiParam(value= "조회수")
	private Integer retvNum;
	
	/** 선게시 여부 */
	@Column(name="prev_pstng_yn")
	@ApiModelProperty(notes="선게시 여부", example= "N")
    @ApiParam(value= "선게시 여부")
	private String prevPstngYn;

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
	
	
	
	/** 선게시 여부 값*/
	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	@Transient
	private String prevPstngYnVal;
}
