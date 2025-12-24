package kr.co.n2m.platform.meta.schema.modelproperty.domain;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.springframework.beans.BeanUtils;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Schema(description="메타데이터 모델 프라퍼티 정보 Dto (외부 API용)")
@Getter
@Setter
public class ModelPropertyApiDto implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="프라퍼티 명")	
	private String prptyNm;
	@Schema(description="프라퍼티 논리명")	
	private String prptyLogicNm;
	@Schema(description="데이터 배열 여부")	
	private String dataArrayYn;
	
	@Schema(description="개수 프라퍼티 여부")
	private String cntPrptyYn;
	@Schema(description="개수 모델 명")
	private String cntModelNm;
	
	@Schema(description="필수 구분 코드")		
	private String modelPrptyMandMtcd;
	@Schema(description="값 예제(설명)")	
	private String modelPrptyValExam;	
	
	@Schema(description="범위 모델의 유형 명")		
	private String rangeTypeModelNm;
	@Schema(description="범위 모델 명")	
	private String rangeModelNm;
	@Schema(description="범위 모델 논리명")	
	private String rangeModelLogicNm;
	@Schema(description="범위 모델 데이터 유형 코드")		
	private String rangeDataTypeMtcd;
	
	@Schema(description="code 범위 모델의 코드 목록")
	private List<Map<String, String>> rangeCodes;
	
	public ModelPropertyApiDto() { /* default 생성자 */ }
	
	public ModelPropertyApiDto(ModelPropertyInfoDto infoDto) {
		BeanUtils.copyProperties(infoDto, this);
	}
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SIMPLE_STYLE, true, true);
    }
    
}
