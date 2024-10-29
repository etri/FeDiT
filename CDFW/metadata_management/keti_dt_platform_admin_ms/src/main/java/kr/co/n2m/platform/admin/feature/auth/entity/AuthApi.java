package kr.co.n2m.platform.admin.feature.auth.entity;

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
@IdClass(AuthApi.class)
@EqualsAndHashCode(callSuper = false)
@Table(name="tb_com_authapimap")
public class AuthApi extends SearchAuth {
	
	private static final long serialVersionUID = -2861534657274650853L;

	/** 권한 Object ID. */
	@Id
	@ApiModelProperty(notes="권한 OID", example="0")
	@ApiParam(value="권한 OID")
	@Column(name="aut_oid")
	private String autOid;
	
	/** API Object ID. */	
	@Id
	@ApiModelProperty(notes="API OID", example="0")
	@ApiParam(value="API OID")
	@Column(name="api_grp_oid")
	private String grpOid;

}
