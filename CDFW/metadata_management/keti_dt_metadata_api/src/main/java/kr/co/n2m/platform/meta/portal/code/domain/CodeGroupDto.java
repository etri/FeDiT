package kr.co.n2m.platform.meta.portal.code.domain;

import java.util.List;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Schema(description="메타데이터 코드 그룹과 코드 목록 Dto")
@Getter
@Setter
public class CodeGroupDto extends CodeGroupVo {

	List<CodeVo> codeList;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
	
}
