package kr.co.n2m.platform.meta.collection.domain;

import java.util.Map;

import javax.annotation.Nullable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import lombok.Getter;
import lombok.Setter;

@Schema(description="메타데이터 수집 매핑 Dto")
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class CollectionMappingDto {
	
	@Schema(description="메타데이터 모델명 (= modelNm)")
	private String metaModel;
	
	@Schema(description="data 의 key 프라퍼티. 없으면 null.")
	@Nullable
	private String keyProperty;
	
	@Schema(description="data 의 프라퍼티 매핑 정의. 왼쪽(data의 프라퍼티) : 오른쪽(매핑 관련 정보). 프라퍼티가 없거나 null 이면 매핑 안함.")
	private Map<String, CollectionPropertyDto> properties;
	
	@Override
	public String toString() {
		return JsonUtil.toJson(this);
	}
    
}
