package kr.co.n2m.platform.meta.architecture.domain;


import org.apache.commons.collections4.map.ListOrderedMap;
import com.google.common.base.CaseFormat;

@SuppressWarnings({"rawtypes", "unchecked"})
public class CamelCaseMap extends ListOrderedMap {
	
	private static final long serialVersionUID = -517705976275643120L;

	@Override
	public Object put(Object key, Object value) {
		key = CaseFormat.UPPER_UNDERSCORE.to(CaseFormat.LOWER_CAMEL, (String)key);
		return super.put((String)key, value);
	}	
}
