package kr.co.n2m.platform.meta.architecture.util;

import org.apache.commons.lang3.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * Influx Util
 *
 * @author n2m
 */
@Slf4j
public class InfluxUtil {

	public final static long UTCSEC20000101 = 947212800; // 2000년 1월 1일 UTC 초	
	
	/**
	 * 공백(space), 등호(=), 쉼표(,), 큰따옴표("), 괄호( (,),{,},[,] ), 콜론(:), 세미콜론(;), 앰퍼샌드(&) 등 제거
	 * @param val
	 * @return
	 * @throws IllegalArgumentException
	 */
	public static String cleanTagValue(String val) throws IllegalArgumentException {
		if (val == null) {
			throw new IllegalArgumentException("유효하지 않은 태그 값입니다.");
		}
		if (val.indexOf(",") != -1) {
			throw new IllegalArgumentException("유효하지 않은 태그 값입니다. ',' 문자를 제거하여 주세요.");
		}
        String regex = "[\\s=,\"(){}\\[\\]\\:;&]"; // 공백(space), 등호(=), 쉼표(,), 큰따옴표("), 괄호( (,),{,},[,] ), 콜론(:), 세미콜론(;), 앰퍼샌드(&) 사용 불가.
		String newVal = val.replaceAll(regex, ""); // 허용되는 문자 외 모두 제거
		if (newVal.getBytes().length > 255) {
			throw new IllegalArgumentException("유효하지 않은 태그 값입니다.  255bytes 이하여야 합니다.");
		}
		return newVal;
	}
	
	/**
	 * 두 문자열을 tag값으로 교정하여 비교 결과를 반환
	 * @param val1
	 * @param val2
	 * @return
	 * @throws IllegalArgumentException
	 */
	public static boolean equalsInTagFormat(String val1, String val2) throws IllegalArgumentException {
		String tagVal1 = cleanTagValue(val1);
		String tagVal2 = cleanTagValue(val2);
		return StringUtils.equals(tagVal1, tagVal2);
	}
	
}
