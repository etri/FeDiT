package kr.co.n2m.platform.meta.resource.keyword.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import lombok.Getter;
import lombok.Setter;

/**
 * 키워드 정보 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class KeywordVo {
	
	private String kywrd;
	private String kywrdLangMtcd;
	private String kywrdRecntDt;
	private String kywrdRegDt;

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
}
