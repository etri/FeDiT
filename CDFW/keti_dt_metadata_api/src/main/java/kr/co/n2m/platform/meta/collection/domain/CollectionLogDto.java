package kr.co.n2m.platform.meta.collection.domain;

import lombok.Getter;
import lombok.Setter;
import org.apache.ibatis.type.Alias;

@Getter
@Setter
@Alias("collectionLogDto")
public class CollectionLogDto extends CollectionLogVo {

	private String colecMappingStr; // TODO 테스트 필요
	
}