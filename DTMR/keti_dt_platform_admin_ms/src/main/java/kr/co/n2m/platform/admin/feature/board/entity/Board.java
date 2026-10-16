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
@Table(name="tb_com_bbs")
@ApiModel(value="게시판 관리")
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class Board extends SearchBoardVO {

	/** 게시판 OID */
	@Id
	@Column(name="bbs_oid")
	@ApiModelProperty(notes="게시판 OID", example= "1")
    @ApiParam(value= "게시판 OID")
	private String bbsOid;

	/** 게시판 명 */
	@Column(name="bbs_nm")
	@ApiModelProperty(notes="게시판 명", example= "테스트 게시판")
    @ApiParam(value= "게시판 명")
	private String bbsNm;

	/** 게시판 코드 */
	@Column(name="bbs_cd")
	@ApiModelProperty(notes="게시판 코드", example= "1234")
    @ApiParam(value= "게시판 코드")
	private String bbsCd;
	
	/** 사용 여부 */
	@Column(name="use_yn")
	@ApiModelProperty(notes="사용 여부", example= "Y")
    @ApiParam(value= "사용 여부")
	private String useYn;
	
	/** 댓글 사용 여부 */
	@Column(name="repl_use_yn")
	@ApiModelProperty(notes="댓글 사용 여부", example= "Y")
    @ApiParam(value= "댓글 사용 여부")
	private String replUseYn;
	
	/** 첨부파일 사용 여부 */
	@Column(name="atc_file_use_yn")
	@ApiModelProperty(notes="첨부파일 사용 여부", example= "Y")
    @ApiParam(value= "첨부파일 사용 여부")
	private String atcFileUseYn;
	
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
	
	/** 플랫폼 아이디 */
	@ApiModelProperty(notes = "플랫폼 아이디", example = "''")
	@ApiParam(value="플랫폼 아이디")
	@Column(name="pltfrm_id")
	private String pltfrmId;
	
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
	
	
	
	/** 사용 여부 값*/
	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	@Transient
	private String useYnVal;
	
	/** 덧글 사용 여부 값*/
	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	@Transient
	private String replUseYnVal;
	
	/** 첨부파일 사용 여부 값 */
	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	@Transient
	private String atcFileUseYnVal;
}
