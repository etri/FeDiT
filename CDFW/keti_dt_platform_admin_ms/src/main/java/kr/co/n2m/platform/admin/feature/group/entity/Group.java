package kr.co.n2m.platform.admin.feature.group.entity;

import java.time.LocalDateTime;
import java.util.List;

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
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@ApiModel(value = "그룹")
@Table(name="tb_com_group")
public class Group extends SearchGroup {

	/** 그룹 ID. */
	@Id
	@ApiModelProperty(notes="그룹 ID", example="0")
	@ApiParam(value="그룹 ID")
	@Column(name="grp_id")
	private String grpId;
	
	/** 그룹명. */
	@ApiModelProperty(notes="그룹 명", example="''")
	@ApiParam(value="그룹 명")
	@Column(name="grp_nm")
	private String grpNm;
	
	/** 그룹 설명 */
	@ApiModelProperty(notes="그룹 설명", example="''")
	@ApiParam(value="그룹 설명")
	@Column(name="grp_desc")
	private String grpDesc;

	/** 등록 일시 */
	@ApiModelProperty(notes="등록 일시", example="''")
	@ApiParam(value="등록 일시")
	@CreatedDate
	@Column(name="reg_dt", updatable = false)
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
	@ApiParam(value="수정 일시")
	@LastModifiedDate
	@Column(name="amd_dt", insertable = false)
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
	
	/** 그룹 사용자 목록 */
	@Transient
	private List<GroupUser> groupUserList;
	
}
