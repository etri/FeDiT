package com.stoneitgt.dt.data.platform.util;

import org.apache.commons.lang3.StringUtils;
import lombok.extern.slf4j.Slf4j;

/**
 * 기본 apache commons StringUtils를 확장한 문자열 유틸 클래스
 * 
 * @author yh.kim
 *
 */
@Slf4j
public class StringUtil extends StringUtils {
	public static String getString(Object obj) {
		return getString(obj, EMPTY);
	}

	public static String getString(Object obj, String defaultStr) {
		return obj == null || "null".equalsIgnoreCase(obj.toString().trim()) ? defaultStr
				: StringUtils.defaultString(obj.toString().trim(), defaultStr);
	}

	public static int getIntValue(Object obj) {
		int result = 0;
		if (obj != null) {
			try {
				result = Integer.parseInt(obj.toString());
			} catch (Exception e) {
				log.error("getInteger error", e);
				result = 0;
			}
		}
		return result;
	}
	
	public static String changeFileName(String filename, String word) {
	    int dotIndex = filename.lastIndexOf('.');
	    String name = filename.substring(0, dotIndex) + word;
	    String ext = filename.substring(dotIndex + 1);
	
	    String newFilename = name + "." + ext;
	
	    return newFilename;
	}
}
