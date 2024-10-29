package kr.co.n2m.platform.meta.resource.metadata.domain;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 프라퍼티 검색 Vo
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 프라퍼티 검색 Vo")
@Getter
@Setter
public class MetadataPropertySearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="메타데이터 셋 ID")
	private String medataSetId;
	
	@Schema(description="프라퍼티 명")
	private String prptyNm;	
	
	@Schema(description="메타데이터 값")
	private String medataVal;
	
	@Schema(description="언어")
	private String langMtcd;
	
	@Schema(description="값 메타데이터 셋 명")
	private String medataValNm;
	
	
	@Schema(description="프라퍼티 ID", hidden=true)
	private String prptyId;
	
	@Schema(description="메타데이터 값 List", hidden=true)
	private List<String> includedMetadataValList;
	
	@Schema(description="메타데이터 Map List", hidden=true)
	private List<Map<String, String>> includedMetadataMapList;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
	
}
