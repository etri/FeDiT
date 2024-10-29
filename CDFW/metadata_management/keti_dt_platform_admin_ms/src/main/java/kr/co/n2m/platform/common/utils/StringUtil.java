package kr.co.n2m.platform.common.utils;

import java.lang.reflect.Array;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * StringUtil
 * 
 * @author (주)엔투엠
 */
@Slf4j
public class StringUtil {

	public static boolean isEmpty(String str) {
		if (str == null || "".equals(str)) {
			return true;
		}
		return false;
	}

	public static boolean isNotEmpty(String str) {
		return !isEmpty(str);
	}

	public static boolean equals(String str1, String str2) {
		return StringUtils.equals(str1, str2);
	}

	public static boolean equalsIgnoreCase(String str1, String str2) {
		return StringUtils.equalsIgnoreCase(str1, str2);
	}

	public static boolean notEquals(String str1, String str2) {
		return !StringUtils.equals(str1, str2);
	}

	public static boolean isNull(Object obj) {

		if (obj == null)
			return true;

		if (obj instanceof String)
			return "".equals(obj.toString().trim());
		else if (obj instanceof List)
			return ((List<?>) obj).isEmpty();
		else if (obj instanceof Map)
			return ((Map<?, ?>) obj).isEmpty();
		else if (obj instanceof Object[])
			return Array.getLength(obj) == 0;
		else
			return true;
	}

	public static boolean isNotNull(Object obj) {
		return !isNull(obj);
	}

	/**
	 * Mobius 고유 ID를 생성 한다. ID format = S + 연월일시분초 + 밀리초 + postfix 밀리초가 같은 경우를 대비하여
	 * 생성 시 postfix 값을 받아 후미에 붙이도록 한다. Sample ==> S20170911100300555000
	 * 
	 * @param postfix 0~999 까지의 값으로 생성ID 후미에 연결
	 * @return
	 * @throws Exception
	 */
	public static String generateID(int postfix) throws Exception {

		if (postfix < 0 || postfix > 999)
			throw new Exception("The value can not exceed 0 to 999");

		NumberFormat numformat = NumberFormat.getIntegerInstance();
		numformat.setMinimumIntegerDigits(3);

		SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmssSSS");
		return String.format("S%s%s", sdf.format(new Date()), numformat.format(postfix));
	}

	public static String getOid() {
		return Long.toString(System.currentTimeMillis());
	}

	public static LocalDate parseLocalDate(String value, String pattern) {
		return LocalDate.parse(value, DateTimeFormatter.ofPattern(pattern));
	}

	public static LocalDateTime parseLocalDateTime(String value, String pattern) {
		return LocalDateTime.parse(value, DateTimeFormatter.ofPattern(pattern));
	}

	public static boolean checkYnValue(String value) {
		if (isEmpty(value)) {
			return false;
		}

		return Arrays.asList(new String[] {"Y", "N"}).stream().anyMatch(e -> e.equals(value));
	}
}
