package kr.co.n2m.platform.meta.resource.metadata.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;
import org.json.simple.JSONObject;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.util.BeanUtil;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import kr.co.n2m.platform.meta.schema.property.domain.PropertyDataTypeDto;
import kr.co.n2m.platform.meta.schema.property.service.PropertyCacheService;

/**
 * json 문자열을 map으로. 
 * 
 * @author  n2m
 */
@SuppressWarnings({ "rawtypes", "serial" })
public class MetadataJsonMap extends ListOrderedMap {
	
	private List<PropertyDataTypeDto> dataTypeList = null;

	@SuppressWarnings("unchecked")
	@Override
	public Object put(Object key, Object value) {
		if (Constant.KEYWORD_META_JSON_STR.equalsIgnoreCase((String)key)) {
			if (value instanceof org.postgresql.util.PGobject) {
				value = ((org.postgresql.util.PGobject) value).getValue();
			}
			ListOrderedMap<String, Object> dataMap = JsonUtil.toObject((String)value, ListOrderedMap.class);
			if (dataMap != null) {
				this.putAll(dataMap);
			}
			return null;
		} else {
			value = convertDataType((String) key, value);
			return super.put((String) key, value);
		}
	}	
		
	@SuppressWarnings("unchecked")
	private Object convertDataType(String key, Object value) {
		if (value == null) return null;
		
//		List<PropertyDataTypeDto> dataTypeList = PropertyCacheService.getPrptyDataTypeListForMetadataJsonMap();
		if (dataTypeList == null) {
			PropertyCacheService propertyCacheService = BeanUtil.getBean("propertyCacheService", PropertyCacheService.class);
			dataTypeList = propertyCacheService.getPrptyDataTypeList();
		}		
		
		if (dataTypeList != null && !dataTypeList.isEmpty()) {
			for (PropertyDataTypeDto dto : dataTypeList) {
				if (StringUtils.equals(dto.getPrptyNm(), key)) {
					// 데이터 유형에 따라 변환 적용
					try {
						switch (dto.getRangeDataTypeMtcd()) {
						
						case "integer":
						case "positiveInteger":
						case "nonNegativeInteger":
						case "nonPositiveInteger":
						case "negativeInteger":
							if (value instanceof List) {
								List<Integer> fList = new ArrayList<Integer>();
								for(String fValue : (List<String>) value) {
									fList.add(Integer.parseInt(fValue));
								}
								value = fList;
							}
							else {									
								value = Integer.parseInt((String) value);
							}
							
							break;
							
							
						case "long":
							if (value instanceof List) {
								List<Long> fList = new ArrayList<Long>();
								for(String fValue : (List<String>) value) {
									fList.add(Long.parseLong(fValue));
								}
								value = fList;
							}
							else {									
								value = Long.parseLong((String) value);
							}
							
							break;
							
							
						case "float":
							if (value instanceof List) {
								List<Float> fList = new ArrayList<Float>();
								for(String fValue : (List<String>) value) {
									fList.add(Float.parseFloat(fValue));
								}
								value = fList;
							}
							else {
								value = Float.parseFloat((String) value);
							}
							
							break;
							
							
						case "double":
							if (value instanceof List) {
								List<Double> fList = new ArrayList<Double>();
								for(String fValue : (List<String>) value) {
									fList.add(Double.parseDouble(fValue));
								}
								value = fList;
							}
							else {
								value = Double.parseDouble((String) value);
							}
							
							break;
							
							
						case "boolean":
							if (value instanceof List) {
								List<Boolean> fList = new ArrayList<Boolean>();
								for(String fValue : (List<String>) value) {
									fList.add(Boolean.parseBoolean(fValue));
								}
								value = fList;
							}
							else {
								value = Boolean.parseBoolean((String) value);
							}
							
							break;
							
							
						case "json":
						case "geoJson":
							JSONObject json = new JSONObject((Map) value);
							value = json;
							
							break;
							
							
						default:
							if (value instanceof List) {
								List<String> fList = new ArrayList<String>();
								for(String fValue : (List<String>) value) {
									fList.add(fValue);
								}
								value = fList;
							}
							else {									
								value = (String) value;
							}
							
							break;
						}
					}
					catch (Exception e) {
						// 변환 실패 시 그대로 유지
					} 
					
					break;
				}
			}
		}
		
        return value;
    }

}
