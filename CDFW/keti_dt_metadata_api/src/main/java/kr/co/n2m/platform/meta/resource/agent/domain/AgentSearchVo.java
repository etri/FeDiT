package kr.co.n2m.platform.meta.resource.agent.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 대리인의 검색 parameter Vo
 * 
 * @author  n2m
 */
@Schema(description="대리인 검색 parameter Vo")
@Getter
@Setter
public class AgentSearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="메타데이터셋 상태 메타코드")
	private String medataSetSttusMtcd;
	@Schema(description="대리인 명")
	private String agntNm;
	@Schema(description="대리인 모델 ID")
	private String agntModelId;
	@Schema(description="대리인 모델 명")	
	private String agntModelNm;	
	
	@Schema(description="수정일 검색기간 시작일")
	private String srchStartDd;
	@Schema(description="수정일 검색기간 종료일")
	private String srchEndDd;

	@Schema(description="대리인 ID")
	private String agntId;
	
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
