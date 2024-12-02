package net.jcms.framework.cd.model;

import lombok.Getter;
import lombok.Setter;
import net.jcms.framework.base.model.BaseModel;

@Getter
@Setter
public class CdDtl extends BaseModel{
	private     String                 cdDtlId;//CD_DTL_ID                   	VARCHAR(20)        코드ID
	private     String                    cdId;//CD_ID                       	VARCHAR(20)        코드분류ID
	private     String                 cdDtlNm;//CD_DTL_NM                   	NVARCHAR(50)       코드명
	private     String              cdDtlLabel;//CD_DTL_LABEL                	VARCHAR(50)        코드라벨
	private     String               cdDtlDesc;//CD_DTL_DESC                 	NVARCHAR(250)      코드설명
	private     String                cdDtlOrd;//CD_DTL_ORD                  	String             코드순서
	private       Long         cdDtlActiveIcon;//CD_DTL_ACTIVE_ICON          	BIGINT             활성아이콘
	private       Long       cdDtlInactiveIcon;//CD_DTL_INACTIVE_ICON        	BIGINT             비활성아이콘
	private    Integer          cdDtlCustomInt;//CD_DTL_CUSTOM_INT           	INT                커스텀데이터숫자

	public String getUseSt() {
		return this.getRecSt();
	}
	public void setUseSt(String recSt) {
		this.setRecSt(recSt);
	}
}
