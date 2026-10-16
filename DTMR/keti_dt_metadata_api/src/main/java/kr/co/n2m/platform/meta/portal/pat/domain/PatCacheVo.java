package kr.co.n2m.platform.meta.portal.pat.domain;

import java.util.Date;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import lombok.Getter;
import lombok.Setter;

/**
 * PAT Cache 정보 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class PatCacheVo extends PatVo {

	@Schema(description="PAT Cache 조회 시점 일자")
	private String patCacheInqDate;

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }	
    
}
