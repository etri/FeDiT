package kr.co.n2m.platform.admin.feature.group.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.IdClass;
import javax.persistence.Table;

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
@IdClass(GroupUser.class)
@EqualsAndHashCode(callSuper = false)
@Table(name="tb_com_groupusermap")
public class GroupUser extends SearchGroup {

	/** 그룹 ID. */
	@Id
	@ApiModelProperty(notes="그룹 ID", example="0")
	@ApiParam(value = "그룹 ID")
	@Column(name="grp_id")
	private String grpId;
	
	/** 사용자 아이디. */	
	@Id
	@ApiModelProperty(notes="사용자 ID", example="0")
	@ApiParam(value = "사용자 ID")
	@Column(name="user_id")
	private String userId;
	
}
