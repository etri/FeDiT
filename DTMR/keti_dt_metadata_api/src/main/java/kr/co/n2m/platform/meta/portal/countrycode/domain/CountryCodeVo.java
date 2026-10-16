package kr.co.n2m.platform.meta.portal.countrycode.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 국가코드의 테이블 기본 정보 Vo
 * 
 * @author  n2m
 */
@Schema(description="국가코드의 테이블 기본 정보 Vo")
@Getter
@Setter
@Alias("countryCodeVo")
public class CountryCodeVo extends BaseVo {

	@Schema(description="국가 코드")
	private String cntryCd;
	@Schema(description="국가 명")
	private String cntryNm;
	@Schema(description="국가 영문 명")
	private String cntryEngNm;
	@Schema(description="국가 숫자")
	private String cntryNumb;
	@Schema(description="국가 알파3")
	private String cntryAlpha3;
	@Schema(description="국가 알파2")
	private String cntryAlpha2;
	@Schema(description="국가 데이터 상태 메타코드")
	private String cntryDataSttusMtcd;
	@Schema(description="국가 데이터 상태 메타코드명", accessMode=AccessMode.READ_ONLY)
	private String cntryDataSttusMtcdNm;
	@Schema(description="국가 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String cntryRegrId;
	@Schema(description="국가 등록자 명", accessMode=AccessMode.READ_ONLY)
	private String cntryRegrNm;
	@Schema(description="국가 등록 일시", accessMode=AccessMode.READ_ONLY)
	private String cntryRegDt;
	@Schema(description="국가 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String cntryAmdrId;
	@Schema(description="국가 수정자 명", accessMode=AccessMode.READ_ONLY)
	private String cntryAmdrNm;
	@Schema(description="국가 수정 일시", accessMode=AccessMode.READ_ONLY)
	private String cntryAmdDt;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
