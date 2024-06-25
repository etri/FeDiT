package kr.co.n2m.platform.common.entity;

import org.apache.commons.collections4.map.ListOrderedMap;

import com.google.common.base.CaseFormat;

public class CamelCaseMap extends ListOrderedMap<Object, Object> {
	private static final long serialVersionUID = -517705976275643120L;

	@Override
	public Object put(Object key, Object value) {
		key = CaseFormat.UPPER_UNDERSCORE.to(CaseFormat.LOWER_CAMEL, (String) key);
		return super.put((String) key, value);
	}
}