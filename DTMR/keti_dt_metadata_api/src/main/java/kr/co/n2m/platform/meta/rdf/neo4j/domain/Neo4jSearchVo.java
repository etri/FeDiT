package kr.co.n2m.platform.meta.rdf.neo4j.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 *  NEO4J 검색 parameter Vo
 * 
 * @author  n2m
 */
@Schema(description="NEO4J 검색 parameter Vo")
@Getter
@Setter
public class Neo4jSearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="검색 방식 (all, medataSet, keyword)")
	private String searchType;
	@Schema(description="NEO4J 조회 LIMIT (CYPHER)")
	private String matchLimit;
	@Schema(description="메타데이터 셋 ID")
	private String medataSetId;
	@Schema(description="label 유형")
	private String labelType;
	@Schema(description="검색어(키워드)")
	private String keywordText;
	@Schema(description="키워드 매칭 방식 (contains/exact)")
	private String keywordMatchType;
	@Schema(description="그래프 보기 방식")
	private String graphView;
	
	@Schema(description="키워드(검색어) 정규화 값")
	private String normKeyword;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}	
}
