package kr.co.n2m.platform.meta.resource.metadata.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import com.apicatalog.jsonld.StringUtils;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 단 건 저장용 Dto
 * 
 * @author  n2m
 */
@Getter
@Setter
@Schema(description="메타데이터 단 건 저장용 Dto")
public class MetadataSaveDto {
	
	@Schema(description="메타데이터 ID")
	private String medataId;
	
	@Schema(description="프라퍼티 ID")
	private String prptyId;
	
	@Schema(description="언어 코드")
	private String langMtcd;
	
	@Schema(description="메타데이터 값 (geoJson 값 포함)")
	private String medataVal; // geoJson 값도 그냥 넣음.
	
	public MetadataSaveDto() { /* default 생성자 */ }
	
	public MetadataSaveDto(MetadataVo metadataVo) {
		this.medataId  = metadataVo.getMedataId();
		this.prptyId   = metadataVo.getPrptyId();
		this.langMtcd  = metadataVo.getLangMtcd();
		this.medataVal = metadataVo.getMedataVal();
		if (StringUtils.isNotBlank(metadataVo.getGeodataVal())) {
			this.medataVal = metadataVo.getGeodataVal();
		}
	}
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }	

}
