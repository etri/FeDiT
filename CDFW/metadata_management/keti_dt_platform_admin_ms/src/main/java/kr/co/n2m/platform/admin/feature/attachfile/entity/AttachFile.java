 package kr.co.n2m.platform.admin.feature.attachfile.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Id;
import javax.persistence.Table;

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
@Table(name="tb_com_attachfile")
@ApiModel(value="첨부 파일")
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class AttachFile {

	/** 첨부 파일 OID */
	@Id
	@Column(name="atc_file_oid")
	@ApiModelProperty(notes="첨부 파일 OID", example= "12345")
    @ApiParam(value= "첨부 파일 OID")
	private String atcOid;

	/** 콘텐츠 OID */
	@Column(name="conts_oid")
	@ApiModelProperty(notes="콘텐츠 OID", example= "12345")
    @ApiParam(value= "콘텐츠 OID")
	private String contsOid;
	
	/** 게시판 OID */
	@Column(name="bbs_oid")
	@ApiModelProperty(notes="게시판 OID", example= "12345")
    @ApiParam(value= "게시판 OID")
	private String bbsOid;

	/** 파일 원본 명 */
	@Column(name="file_origin_nm")
	@ApiModelProperty(notes="파일 원본 명", example= "테스트 파일")
	@ApiParam(value= "파일 원본 명")
	private String fileOriginNm;
	
	/** 파일 보관 명 */
	@Column(name="file_resto_nm")
	@ApiModelProperty(notes="파일 보관 명", example= "테스트 보관 파일")
	@ApiParam(value= "파일 보관 명")
	private String fileRestoNm;
	
	/** 파일 보관 경로 */
	@Column(name="file_resto_path")
	@ApiModelProperty(notes="파일 보관 경로", example= "테스트 파일 보관 경로")
	@ApiParam(value= "파일 보관 경로")
	private String fileRestoPath;
	
	/** 파일 크기 */
	@Column(name="file_size")
	@ApiModelProperty(notes="파일 크기", example= "1")
	@ApiParam(value= "파일 크기")
	private long fileSize;
	
    public AttachFile(String fileOriginNm, String fileRestoNm, String fileRestoPath, long fileSize) {
    	this.fileOriginNm = fileOriginNm;
    	this.fileRestoNm = fileRestoNm;
    	this.fileRestoPath = fileRestoPath;
    	this.fileSize = fileSize;
    }

}
