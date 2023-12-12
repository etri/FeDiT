package kr.co.n2m.platform.meta.search.elasticsearch.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 *  elastic 검색 parameter Vo
 * 
 * @author  n2m
 */
@Schema(description="elastic 검색 parameter Vo")
@Getter
@Setter
public class ElasticSearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="elastic 검색 내용")
	private String elasticContent;
	
	@Schema(description="elastic 검색 등록일 시작일")
	private String elasticStartDd;
	
	@Schema(description="elastic 검색 등록일 종료일")
	private String elasticEndDd;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}	
}
