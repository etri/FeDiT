package kr.co.n2m.platform.meta.portal.pat.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * PAT 정보 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class PatVo extends BaseVo {

	@Schema(description="PAT 아이디", accessMode=AccessMode.READ_ONLY)
	private String patkId;
	@Schema(description="토큰 명")
	private String toknNm;
	@Schema(description="토큰 값")
	private String toknVal;
	@Schema(description="토큰 만료 일자")
	private String toknExpDate;
	@Schema(description="PAT 등록자 아이디")
	private String patkRegrId;
	@Schema(description="PAT 등록자 명")
	private String patkRegrNm;
	@Schema(description="PAT 등록 일시")
	private String patkRegDt;

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }	
    
}
