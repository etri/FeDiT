package kr.co.n2m.platform.meta.resource.agent.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 대리인의 테이블 기본 정보 Vo
 * 
 * @author  n2m
 */
@Schema(description="대리인의 테이블 기본 정보 Vo")
@Getter
@Setter
@Alias("agentVo")
public class AgentVo extends BaseVo {

	@Schema(description="대리인 ID")
	private String agntId;
	@Schema(description="대리인 명")
	private String agntNm;
	@Schema(description="대리인 모델 ID")
	private String agntModelId;
	@Schema(description="대리인 모델 명", accessMode=AccessMode.READ_ONLY)	
	private String agntModelNm;
	@Schema(description="메타데이터셋 상태 메타코드")
	private String medataSetSttusMtcd;
	@Schema(description="메타데이터셋 상태 메타코드명")
	private String medataSetSttusMtcdNm;	
	@Schema(description="대리인 설명")
	private String agntDesc;
	@Schema(description="대리인 영문 명")
	private String agntEngNm;
	@Schema(description="대리인 영문 설명")
	private String agntEngDesc;
	@Schema(description="대리인 전화 번호")
	private String agntTelNo;
	@Schema(description="대리인 홈페이지")
	private String agntHpage;
	@Schema(description="대리인 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String agntRegrId;
	@Schema(description="대리인 등록자 명", accessMode=AccessMode.READ_ONLY)
	private String agntRegrNm;
	@Schema(description="대리인 등록 일시", accessMode=AccessMode.READ_ONLY)
	private String agntRegDt;
	@Schema(description="대리인 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String agntAmdrId;
	@Schema(description="대리인 수정자 명", accessMode=AccessMode.READ_ONLY)
	private String agntAmdrNm;
	@Schema(description="대리인 수정 일시", accessMode=AccessMode.READ_ONLY)
	private String agntAmdDt;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}	
}
