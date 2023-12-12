package kr.co.n2m.platform.meta.schema.model.domain;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.MetadataSetRangeModelId;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyInfoDto;

/**
 * 메타데이터 모델 상세 정보 Dto
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 모델 상세 정보 Dto")
public class ModelInfoDto extends ModelVo {

	@Schema(description="모델 프라퍼티 정보 Map")
	private ListOrderedMap<String, ModelPropertyInfoDto> propertyMap;

	@Schema(description="셋 용 프라퍼티 명과 셋 Vo 칼럼명 매핑")	
	private Map<String, String> propertyNmToSetColMap;
	
	@Schema(description="셋 Vo 칼럼명 과 셋 용 프라퍼티 명 매핑")	
	private Map<String, String> selColToPropertyNmMap;

	@Schema(description="배열 데이터 유형 프라퍼티 명 목록")
	private List<String> dataArrayYnPropertyNmList;
	
	@Schema(description="GeoJSON 데이터 유형 프라퍼티 명 목록")	
	private List<String> geoJsonPropertyNmList;
	
	@Schema(description="JSON 과 기타 데이터 유형 프라퍼티 명 목록")
	private List<String> jsonEtcPropertyNmList;		
	
	@Schema(description="참조 프라퍼티 명 매핑")
	private Map<String, String> refPropertyNmMap;
	
	@Schema(description="개수 프라퍼티 명 목록")
	private List<String> cntPropertyNmList;
	
	
	public ModelInfoDto() { /* default 생성자 */ }
	
	public ModelInfoDto(ModelVo modelVo) {
		this.copyPropertiesFrom(modelVo);
	}
	
	public ListOrderedMap<String, ModelPropertyInfoDto> getPropertyMap() {
		return this.propertyMap;
	}
	
	public void setPropertyMap(ListOrderedMap<String, ModelPropertyInfoDto> propertyMap) {
		this.propertyMap = propertyMap;
		this.makeMetadataSetColMap();
	}
	
	private void makeMetadataSetColMap() {
		if (propertyMap == null || propertyMap.isEmpty()) return;
		
		// 메타데이터 셋 에 들어갈 범위 모델(값 모델). 각 메타데이터 셋 에 1건만 존재하기로 함. => 해당 프라퍼티 도 1건씩만 존재.
		propertyNmToSetColMap = new HashMap<>();
		selColToPropertyNmMap = new HashMap<>();
		for (MetadataSetRangeModelId rangeModelId : MetadataSetRangeModelId.values()) {
			for (ModelPropertyInfoDto dto : propertyMap.valueList()) {
				if (StringUtils.equals(rangeModelId.code(), dto.getRangeModelId())) {
					propertyNmToSetColMap.put(dto.getPrptyNm(), rangeModelId.getMetadataSetCol());
					selColToPropertyNmMap.put(rangeModelId.getMetadataSetCol(), dto.getPrptyNm());
					break;
				}
			}
		}
		
		dataArrayYnPropertyNmList = new ArrayList<>();
		geoJsonPropertyNmList     = new ArrayList<>();
		jsonEtcPropertyNmList     = new ArrayList<>();
		refPropertyNmMap          = new HashMap<>();
		cntPropertyNmList		  = new ArrayList<>();
		for (ModelPropertyInfoDto dto : propertyMap.valueList()) {
			if (StringUtils.equals("Y", dto.getDataArrayYn())) {
				dataArrayYnPropertyNmList.add(dto.getPrptyNm());
			}
			
			if ("geoJson".equals(dto.getRangeDataTypeMtcd())) {
				geoJsonPropertyNmList.add(dto.getPrptyNm());
			}
			else if ("json".equals(dto.getRangeDataTypeMtcd())) { // JSON 외 기타. 현재는 JSON만 
				jsonEtcPropertyNmList.add(dto.getPrptyNm());
			}			
			
			if (StringUtils.isNotBlank(dto.getRangeRefPrptyNm())) {
				refPropertyNmMap.put(dto.getRangeRefPrptyNm(), dto.getPrptyNm()); // code, codeName OR categoryId, categotyName 프라퍼티 맵 OR object_type 의 메타데이터 셋 ID, refSetName
			}
			
			if (StringUtils.equals("Y", dto.getCntPrptyYn())) {
				cntPropertyNmList.add(dto.getPrptyNm());
			}
		}
	}
	
	public Map<String, String> getPropertyNmToSetColMap() {
		return this.propertyNmToSetColMap;
	}
	
	public Map<String, String> getSelColToPropertyNmMap() {
		return this.selColToPropertyNmMap;
	}
	
	public List<String> getArrayPropertyNmList() {
		return this.dataArrayYnPropertyNmList;
	}
	
	public List<String> getGeoJsonPropertyNmList() {
		return this.geoJsonPropertyNmList;
	}
	
	public List<String> getJsonEtcPropertyNmList() {
		return this.jsonEtcPropertyNmList;
	}
	
	public Map<String, String> getRefPropertyNmMap() {
		return this.refPropertyNmMap;
	}
	
	public List<String> getCntPropertyNmList() {
		return this.cntPropertyNmList;
	}
	
	public ModelPropertyInfoDto getPropertyInfoDto(String propertyNm) {
		if (propertyMap == null || propertyMap.isEmpty()) return null;
		return this.propertyMap.get(propertyNm);
	}
	
	public String getMetadataSetCol(String propertyNm) {
		if (propertyNmToSetColMap == null || propertyNmToSetColMap.isEmpty()) return null;
		return this.propertyNmToSetColMap.get(propertyNm);
	}
	
	public String getPropertyNm(String metadataSetCol) {
		if (selColToPropertyNmMap == null || selColToPropertyNmMap.isEmpty()) return null;
		return this.selColToPropertyNmMap.get(metadataSetCol);
	}
	
	public String getPropertyNmById(String propertyId) {
		if (propertyMap == null || propertyMap.isEmpty()) return null;
		for (ModelPropertyInfoDto dto : propertyMap.valueList()) {
			if (StringUtils.equals(propertyId, dto.getPrptyId())) {
				return dto.getPrptyId();
			}
		}
		return null;
	}
	
	public String getPropertyId(String propertyNm) { 
		if (propertyMap == null || propertyMap.isEmpty()) return null;
		return this.propertyMap.get(propertyNm).getPrptyId();
	}

}
