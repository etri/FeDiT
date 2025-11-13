package kr.co.n2m.platform.admin.feature.auth.entity;

import org.apache.ibatis.type.Alias;

import kr.co.n2m.platform.admin.feature.common.entity.SearchVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

 /**
 * 권한 그룹 검색 VO
 * @author (주)엔투엠
 */
@Alias("searchAuthgroupVo")
@EqualsAndHashCode(callSuper = false)
@Data
public class SearchAuthgroupVO extends SearchVO {

    /** The Constant serialVersionUID. */
    private static final long serialVersionUID = -6572189870211514864L;

	/** The search grp name. */
	private String searchGrpName;

	/** The search act yn. */
	private String searchActTF;
	
	private boolean searchAdminTF;

	private String searchWord;
	
	private String searchType;

	private String searchGrpAdminFlag;

	// --------------------------------------------------
	// Search Variable - Authgroup Menu

	// T1. 최 상위 권한 그룹 메뉴 목록 조회
	// T2. 
	private String searchTypeAuthgroupMenuList;

	private String searchPortalCodeID;
	
	private String searchParentOid;
	// TODO 사용 불가
	// private String searchPortalCodeValue;

	private String searchAuthgroupOid;

	private String searchMenuOid;

	private String searchUserId;

}
