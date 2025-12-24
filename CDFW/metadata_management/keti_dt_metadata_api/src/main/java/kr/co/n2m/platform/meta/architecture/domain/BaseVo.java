package kr.co.n2m.platform.meta.architecture.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.springframework.beans.BeanUtils;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.SqlDatePart;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

/**
 * base Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public abstract class BaseVo {
	
	// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
	@Getter(AccessLevel.NONE)	
	@Schema(description="SQL 날짜 format", hidden=true)
	private String sqlDateFormat = SqlDatePart.iso6z.format();
	
	@Schema(description="사용자 정보 (비동기 처리시 사용)", hidden=true)
	private LoginUserVo asyncUserVo;
	
	public void copyPropertiesFrom(final Object sourceVo) {
		BeanUtils.copyProperties(sourceVo, this);
	}
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    	
}
