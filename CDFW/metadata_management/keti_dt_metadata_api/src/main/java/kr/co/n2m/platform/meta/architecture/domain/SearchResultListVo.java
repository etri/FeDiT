package kr.co.n2m.platform.meta.architecture.domain;

import java.io.Serializable;
import java.util.List;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import lombok.Getter;
import lombok.Setter;

/**
 * API 검색결과 목록 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class SearchResultListVo implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	/** 검색결과 목록 */
	@SuppressWarnings("rawtypes")
	List list;
	
	/** 페이징 정보 */
	PageVo page;
	
	
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.MULTI_LINE_STYLE, true, true);
    }	
	
}
