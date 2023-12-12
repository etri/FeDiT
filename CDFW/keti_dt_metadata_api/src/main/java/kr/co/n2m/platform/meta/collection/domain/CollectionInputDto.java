package kr.co.n2m.platform.meta.collection.domain;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonRawValue;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import lombok.Getter;
import lombok.Setter;

@Schema(description="메타데이터 수집 입력 Dto")
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class CollectionInputDto {
	
	@Schema(description="메타데이터 모델과의 매핑 정보")
	private CollectionMappingDto mapping;
	
	@Schema(description="실 데이터. 배열 형식.")
	@JsonRawValue
	private List<Object> data;
	
	@Override
	public String toString() {
		return JsonUtil.toJson(this);
	} 
	
}
