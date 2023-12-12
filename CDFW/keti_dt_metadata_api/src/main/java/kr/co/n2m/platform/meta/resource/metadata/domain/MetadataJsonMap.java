package kr.co.n2m.platform.meta.resource.metadata.domain;

import org.apache.commons.collections4.map.ListOrderedMap;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;

/**
 * json 문자열을 map으로. 
 * 
 * @author  n2m
 */
@SuppressWarnings({ "rawtypes", "serial" })
public class MetadataJsonMap extends ListOrderedMap {
	
	@SuppressWarnings("unchecked")
	@Override
	public Object put(Object key, Object value) {
		if (Constant.KEYWORD_META_JSON_STR.equalsIgnoreCase((String)key)) {
			if (value instanceof org.postgresql.util.PGobject) {
				value = ((org.postgresql.util.PGobject) value).getValue();
			}
			ListOrderedMap<String, Object> dataMap = JsonUtil.toObject((String)value, ListOrderedMap.class);
			this.putAll(dataMap);
			return null;
		} else {
			return super.put((String)key, value);
		}
	}	

}
