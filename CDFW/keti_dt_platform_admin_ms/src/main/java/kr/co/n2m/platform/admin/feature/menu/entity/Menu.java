package kr.co.n2m.platform.admin.feature.menu.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@ApiModel(value = "메뉴")
@EntityListeners(AuditingEntityListener.class)
@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Table(name = "tb_com_menu")
public class Menu extends SearchMenu {

	/** 메뉴 Object ID. */
	@Id
	@Column(name = "menu_oid")
	@ApiModelProperty(notes="메뉴 OID", example="1672967564889")
	@ApiParam(value = "메뉴 OID")
	private String menuOid;

	/** 메뉴 ID. */
	@Column(name = "menu_id")
	@ApiModelProperty(notes="메뉴 ID", example="MNU_33333334")
	@ApiParam(value = "메뉴 ID")
	private String menuId;

	/** 메뉴 명. */
	@Column(name = "menu_nm")
	@ApiModelProperty(notes="메뉴명", example="테스트 메뉴")
	@ApiParam(value = "메뉴명")
	private String menuNm;

	/** 상위 메뉴 Object ID. */
	@Column(name = "up_menu_oid")
	@ApiModelProperty(notes="상위 메뉴 OID", example="''")
	@ApiParam(value = "상위 메뉴 OID")
	private String upMenuOid;

	/** 메뉴 설명 */
	@Column(name = "menu_desc")
	@ApiModelProperty(notes="메뉴 설명", example="''")
	@ApiParam(value = "메뉴 설명")
	private String menuDesc;

	/** 메뉴 대상 코드 */
	@Column(name = "menu_tgt_cd")
	@ApiModelProperty(notes="메뉴 대상 코드", example="''")
	@ApiParam(value = "메뉴 대상 코드")
	private String menuTgtCd;

	/** 사용 y:use *. */
	@Column(name = "use_yn")
	@ApiModelProperty(notes="메뉴 사용 여부", example="Y")
	@ApiParam(value = "메뉴 사용 여부")
	private String useYn;

	/** 메뉴 URL. */
	@Column(name = "url")
	@ApiModelProperty(notes="메뉴 URL", example="''")
	@ApiParam(value = "메뉴 사용 URL")
	private String menuUrl;

	/** 메뉴 URL에 붙을 파라미터 (key1=value1&key2=value2 형태). */
	@Column(name = "url_param")
	@ApiModelProperty(notes="메뉴 URL Param", example="''")
	@ApiParam(value = "메뉴 URL Param")
	private String urlParam;

	/** 유형 코드 */
	@Column(name = "type_cd")
	@ApiModelProperty(notes="유형 코드", example="Y")
	@ApiParam(value = "유형 코드")
	private String typeCd;

	/** 플랫폼 ID */
	@Column(name = "pltfrm_id")
	@ApiModelProperty(notes="플랫폼 ID", example="''")
	@ApiParam(value = "플랫폼 ID")
	private String pltfrmId;

	/** 순서. */
	@Column(name = "odrg")
	@ApiModelProperty(notes="순서", example="0")
	@ApiParam(value = "순서", example = "0")
	private Integer odrg;

	/** 팝업 여부 */
	@Column(name = "popup_yn")
	@ApiModelProperty(notes="팝업 여부", example="N")
	@ApiParam(value = "팝업 여부")
	private String popupYn;

	/** 팝업 가로 */
	@Column(name = "popup_wdth")
	@ApiModelProperty(notes="팝업 가로", example = "0")
	@ApiParam(value="팝업 가로", example = "0")
	private Integer popupWdth;

	/** 팝업 높이 */
	@Column(name = "popup_hght")
	@ApiModelProperty(notes="팝업 높이", example = "0")
	@ApiParam(value="팝업 높이", example = "0")
	private Integer popupHght;
	
	/** 관리자 여부 */
	@Column(name = "admr_yn")
	@ApiModelProperty(notes="관리자 여부", example="N")
	@ApiParam(value = "관리자 여부")
	private String admrYn;
	
	/** 메뉴 아이콘 */
	@Column(name = "menu_icon")
	@ApiModelProperty(notes="메뉴 아이콘", example="Document")
	@ApiParam(value = "메뉴 아이콘")
	private String menuIcon;

	/** 등록 일시 */
	@Column(name = "reg_dt", updatable = false)
	@CreatedDate
	@ApiModelProperty(notes="등록 일시", example="''")
	@ApiParam(value = "등록 일시")
	private LocalDateTime regDT;

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
	@Column(name = "amd_dt", insertable = false)
	@LastModifiedDate
	@ApiModelProperty(notes="수정 일시", example="''")
	@ApiParam(value = "수정 일시")
	private LocalDateTime amdDT;

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
	
	/** 메뉴가 열릴 target Code 명 (getter만 제공). */
	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	@Transient
	private String tgtCdNm;

	/** 메뉴가 열릴 target Code 값 (값이 set 되면 targetCod도 set된다.) */
	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	@Transient
	private String tgtCdVal;
	
	// ------------------------------------------------------------------------------------------
	// 계층형 데이터 구성 시 사용

	/** 하위 메뉴 목록. */
	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	@Transient
	private List<Menu> children = new ArrayList<>();

	/** 상위 메뉴 명. */
	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	@Transient
	private String upMenuName;

	@ApiModelProperty(hidden = true)
	@ApiParam(value = "권한 OID")
	@Transient
	private String autOid;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	public boolean isFolder() {
		return (children == null || children.size() <= 0) ? false : true;
	}

	public void addChild(Menu menuVO) {
		if (this.children == null) {
			this.children = new ArrayList<Menu>();
		}

		this.children.add(menuVO);
	}
	
	/** getAuthMenuList 작업 시 AuthMenu entity 추가 . */
	@ApiModelProperty(notes="읽기 여부", example="Y")
	@ApiParam(value = "읽기 여부")
	@Transient
	private String readYn;

	@ApiModelProperty(notes="쓰기 여부", example="Y")
	@ApiParam(value = "쓰기 여부")
	@Transient
	private String writeYn;
	

	@ApiModelProperty(notes="수정 여부", example="Y")
	@ApiParam(value = "수정 여부")
	@Transient
	private String amdYn;
	
	@ApiModelProperty(notes="삭제 여부", example="N")
	@ApiParam(value = "삭제 여부")
	@Transient
	private String delYn;

}
