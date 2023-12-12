package kr.co.n2m.platform.meta.collection.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Schema(description="메타데이터 수집 매핑 프라퍼티 정보 Dto")
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class CollectionPropertyDto {
	
	@Schema(description="매핑 프라퍼티 명. 메타데이터 모델에 매핑 프라퍼티 명이 없다면 무시됨.")
	private String name;
	
	@Schema(description="주어진 데이터의 배열 여부", defaultValue="N")
	private String arrayYn;
	
	@Schema(description="값이 다른 유형일 경우 메타데이터 모델과의 매핑 정보. 값이 리터럴인 경우 null")
	private CollectionMappingDto mapping;
	
}
