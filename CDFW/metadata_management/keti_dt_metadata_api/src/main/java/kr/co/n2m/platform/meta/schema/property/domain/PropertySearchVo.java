package kr.co.n2m.platform.meta.schema.property.domain;

import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;


@Schema(description="프라퍼티 검색 VO")
@Getter
@Setter
@Alias("propertySearchVo")
public class PropertySearchVo extends SearchVo {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

	private String searchName;
	
	private String prptyId;
	private String prptyNm;
	private String prptyAmdStDt;
	private String prptyAmdEnDt;
	private String prptyDataSttusMtcd;
	private String rangeModelId;
	
	private String domnModelId;
	private String dataArrayYn;
	private String prptyScrnIndcYn;
	
}
