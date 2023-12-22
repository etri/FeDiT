package com.stoneitgt.common;

import java.util.HashMap;

public class LowerKeyMap extends HashMap<Object, Object> {
	/** serialVersionUID */
	private static final long serialVersionUID = 2244013042329551131L;

	/**
	 * key 에 대하여 소문자로 변환하여 super.put(ListOrderedMap) 을 호출한다.
	 * 
	 * @param key   - '_' 가 포함된 변수명
	 * @param value - 명시된 key 에 대한 값 (변경 없음)
	 * @return previous value associated with specified key, or null if there was no
	 *         mapping for key
	 */
	public Object put(Object key, Object value) {
		return super.put(String.valueOf(key).toLowerCase(), value);
	}
}
