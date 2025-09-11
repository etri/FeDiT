package kr.co.n2m.platform.meta.resource.metadata.domain;

import java.io.Serializable;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 검색 Vo (외부 API용)
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 검색 Vo (외부 API용)")
@Getter
@Setter
public class MetadataApiSearchVo extends PageVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

	@Schema(description="프라퍼티 검색조건 ex)query=prptyNm1==val;prptyNm2>=val2;prptyNm3^=val3 <br/><br/>"
			+ "== : equal, != : not equal, >= : greater than or equal to,<br/>"
			+ ">  : greater than, <= : less than or equal to, <  : less than,<br/>"
			+ "^= : starts with, *= : like, $= : ends with"
			)
	private String query;
		
	@Schema(description="메타데이터 모델 명")
	private String metaModel;

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
	
	@Schema(description="디지털트윈 ID")
	private String digitalTwinId;
	
	@Schema(description="metaTypeModel 을 조회할지 여부")
	private String metaTypeModelShowYn = "N";
	
	@Schema(description="배열 데이터 조회 제한 건수", defaultValue="20")
	private int arrayDataLimit = 20;
	
	@Schema(description="object 참조 형식 : none/id/object", defaultValue="none")
	private String objectRefFormat = "none";
	
	@Schema(description="디지털트윈의 객체 타입 속성(프라퍼티명)")
	private String dtwObjsAttr;
	
	@Schema(description="디지털트윈의 객체 타입 속성(프라퍼티명) 존재 여부")
	public boolean getHasDtwObjsAttr() {
		return StringUtils.isNotEmpty(dtwObjsAttr);
	}
	
	public MetadataApiSearchVo() { /* default 생성자 */ }
	
	public MetadataApiSearchVo(PageVo pageVo) {	
		super(pageVo);
	}

	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
	
}
