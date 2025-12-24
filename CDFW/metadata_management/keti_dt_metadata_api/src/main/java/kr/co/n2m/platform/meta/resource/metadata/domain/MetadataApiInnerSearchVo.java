package kr.co.n2m.platform.meta.resource.metadata.domain;

import java.io.Serializable;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.springframework.beans.BeanUtils;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 검색 Vo (외부 API용) - 내부에서만 사용
 * 
 * @author  n2m
 */
@Getter
@Setter
public class MetadataApiInnerSearchVo extends MetadataApiSearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

	@Schema(description="프라퍼티 검색조건 ex)query=prptyNm1==val;prptyNm2>=val2;prptyNm3^=val3 <br/><br/>"
			+ "== : equal, != : not equal, >= : greater than or equal to,<br/>"
			+ ">  : greater than, <= : less than or equal to, <  : less than,<br/>"
			+ "^= : starts with, *= : like, $= : ends with"
			)
	private String query;
	@Schema(description="프라퍼티 검색조건 SQL (내부에서 동적 생성)", hidden=true)	
	private String querySql;
	
	@Schema(description="유형 모델 명")
	private String typeModelNm;
	@Schema(description="유형 모델 ID")
	private String typeModelId;
	
	@Schema(description="모델 명")
	private String modelNm;
	@Schema(description="모델 ID")
	private String modelId;	
	
	@Schema(description="보여줄 프라퍼티 명 목록 ex)[ \"sensorId\", \"sensorName\", \"dataInterval\" ] ")
	private List<String> showPrptyNmList;	
	
	@Schema(description="메타데이터 수정일 검색기간 시작일 (yyyy-MM-dd)")
	private String srchStartDd;
	@Schema(description="메타데이터 수정일 검색기간 종료일 (yyyy-MM-dd)")
	private String srchEndDd;
	
	@Schema(description="언어 코드 ex)ko 로 검색시 ko 인 것과 언어무관(null)인 값들만 나옴.")
	private String langMtcd;

	@Schema(description="메타데이터 셋 명")
	private String srchText;
	@Schema(description="메타데이터 셋 ID")
	private String medataSetId;	
	@Schema(description="메타데이터 셋 상태 (regist/use/unused/disuse)")
	private String medataSetSttusMtcd;		
	@Schema(description="메타데이터 셋 등록자 ID")
	private String medataSetRegrId;
	
	@Schema(description="metaTypeModel 을 조회할지 여부")
	private String metaTypeModelShowYn = "N";
	
	@Schema(description="참조 object_type 검색조건 SQL (내부에서 동적 생성)", hidden=true)	
	private String refObjFilterQuerySql;
	
	@Schema(description="참조 object_type 검색조건 SQL 존재 여부 (적용)", hidden=true)	
	public boolean getApplyRefFilter() {
		return StringUtils.isNotEmpty(refObjFilterQuerySql);
	}
	
	public MetadataApiInnerSearchVo() { /* default 생성자 */ }
	
	public MetadataApiInnerSearchVo(PageVo pageVo) {	
		super(pageVo);
	}
	
	public MetadataApiInnerSearchVo(MetadataApiSearchVo searchVo) {	
		BeanUtils.copyProperties(searchVo, this);
	}

	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
	
}
