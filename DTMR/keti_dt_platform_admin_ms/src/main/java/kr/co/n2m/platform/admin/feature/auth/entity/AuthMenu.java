package kr.co.n2m.platform.admin.feature.auth.entity;

//import java.io.Serializable;
//import java.util.List;

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
@IdClass(AuthMenu.class)
@EqualsAndHashCode(callSuper = false)
@Table(name="tb_com_authmenumap")
public class AuthMenu extends SearchAuth {

	private static final long serialVersionUID = 1L;

	/** 권한 Object ID. */
	@Id
	@ApiModelProperty(notes="권한 OID", example="0")
	@ApiParam(value="권한 OID")
	@Column(name="aut_oid")
    private String autOid;

    /** 메뉴 Object ID. */
	@Id
	@ApiModelProperty(notes="메뉴 OID", example="0")
	@ApiParam(value="메뉴 OID")
	@Column(name="menu_oid")
    private String menuOid;
	
	/** 읽기 여부. */
	@ApiModelProperty(notes="읽기 여부", example="''")
	@ApiParam(value="읽기 여부")
	@Column(name="read_yn")
	private String readYn;
	
	/** 쓰기 여부. */
	@ApiModelProperty(notes="쓰기 여부", example="''")
	@ApiParam(value="쓰기 여부")
	@Column(name="write_yn")
	private String writeYn;

    /** 수정 여부. */
	@ApiModelProperty(notes="수정 여부", example="''")
	@ApiParam(value = "수정 여부")
	@Column(name="amd_yn")
    private String amdYn;
	
    /** 삭제 여부. */
	@ApiModelProperty(notes="삭제 여부", example="''")
	@ApiParam(value = "삭제 여부")
	@Column(name="del_yn")
    private String delYn;
	
    
}
