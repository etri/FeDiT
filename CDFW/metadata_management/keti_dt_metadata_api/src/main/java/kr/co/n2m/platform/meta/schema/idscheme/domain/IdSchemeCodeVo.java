package kr.co.n2m.platform.meta.schema.idscheme.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 디지털트윈 식별체계 코드 Vo
 * 
 * @author  n2m
 */
@Schema(description="디지털트윈 식별체계 코드 Vo")
@Getter
@Setter
public class IdSchemeCodeVo extends BaseVo {

	@Schema(description="식별체계 코드")
	private String idSchmCd;
	
	@Schema(description="식별체계 코드 명")
	private String idSchmCdNm;
	
	@Schema(description="식별체계 코드 영문 명")
	private String idSchmCdEngNm;
	
	@Schema(description="코드 크기 구분 메타코드 (대/중/소/세/세세 코드)")
	private String cdSizeDivMtcd;
	
	@Schema(description="대분류 외부 코드")
	private String lctgExtrCd;
	
	@Schema(description="원본 외부 코드")
	private String originExtrCd;
	
	@Schema(description="식별 사용 여부")	
	private String idfyUseYn;
	
	@Schema(description="사용 여부")
	private String useYn;
	
	@Schema(description="식별체계 코드 설명")
	private String idSchmCdDesc;
	
	@Schema(description="등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String idSchmCdRegrId;
	@Schema(description="등록자 명", accessMode=AccessMode.READ_ONLY)
	private String idSchmCdRegrNm;
	@Schema(description="등록일시", accessMode=AccessMode.READ_ONLY)
	private String idSchmCdRegDt;
	@Schema(description="수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String idSchmCdAmdrId;
	@Schema(description="수정자 명", accessMode=AccessMode.READ_ONLY)
	private String idSchmCdAmdrNm;
	@Schema(description="수정일시", accessMode=AccessMode.READ_ONLY)
	private String idSchmCdAmdDt;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }	
}
