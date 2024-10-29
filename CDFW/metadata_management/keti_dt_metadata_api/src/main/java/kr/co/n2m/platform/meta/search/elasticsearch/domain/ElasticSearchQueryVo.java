package kr.co.n2m.platform.meta.search.elasticsearch.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 *  elasticsearch 쿼리 parameter Vo
 * 
 * @author  n2m
 */
@Schema(description="elasticsearch 쿼리 parameter Vo")
@Getter
@Setter
public class ElasticSearchQueryVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="HTTP 메서드")
	private String httpMethod;
	
	@Schema(description="인덱스 & 엔드포인트")
	private String indexEndpoint;
	
	@Schema(description="쿼리 JSON")
	private String queryJson;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}	
}
