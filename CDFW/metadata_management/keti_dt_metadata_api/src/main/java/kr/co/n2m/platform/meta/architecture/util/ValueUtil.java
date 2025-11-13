package kr.co.n2m.platform.meta.architecture.util;

import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * ValueUtil
 * 
 * @author  n2m
 */
@Component
public class ValueUtil {
	
	private static String springProfilesActive = "local";  			// 현재 서버환경. local/dev/prod/test
	
	@Value("${spring.profiles.active}")
	public void setSpringProfilesActive(String active) {
		springProfilesActive = active;
	}
	
	private static int keyIndex = 0;
	
	private static int getKeyIndex() {
		int idx = keyIndex++;
		if (idx == 999) {
			try {
				Thread.sleep(1); // System.currentTimeMillis() 가 바뀔수 있을 정도의 시간만 준다.
			} catch (InterruptedException e) { /* skip */ }			
			keyIndex = 0;	
		}
		return idx;
	}
	
	private static int logKeyIndex = 0;
	
	private static int getLogKeyIndex() {
		int idx = logKeyIndex++;
		if (idx == 99999) {
			try {
				Thread.sleep(1); // System.currentTimeMillis() 가 바뀔수 있을 정도의 시간만 준다.
			} catch (InterruptedException e) { /* skip */ }			
			logKeyIndex = 0;
		}
		return idx;
	}
	
	public static final DateFormat SDF_DD = new SimpleDateFormat("yyyy-MM-dd");
	
	public static final DateFormat SDF_DT = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");	
	
	public static final DateFormat SDF_YEAR = new SimpleDateFormat("yyyy");	
	
	public static final DateFormat SDF_YEARMONTH = new SimpleDateFormat("yyyy-MM");	
	
	public static final String REQUIRED_MSG = " : 필수 입력 값 입니다.";
	
	public static final String GREATER_THAN_MSG = " : %s 보다 커야 합니다.";
	
	public static final String GREATER_THAN_OR_EQUAL_TO_MSG = " : %s 이상이어야 합니다.";
	
	public static final String MUSTBE_BETWEEN_MSG = " : %s ~ %s 사이이어야 합니다.";
	
	public static final String INVALID_MSG = " : 유효한 값이 아닙니다.";
	
	public static final String INVALID2_MSG = " : 유효한 값이 아닙니다. (%s)";
	
	public static final String CANNOT_DELETE_MSG = "삭제할 수 없습니다.";
	
	public static final String ROW_NUMBER_MSG = "%d 번째 : ";
	
	public static final String NOT_DEFINED_MSG = " : 관련 정보가 정의되지 않았습니다. (%s)";
	
	public static final String MUSTBE_ARRAY_MSG = " : 배열 데이터이어야 합니다.";
	
	
	/* Invalidate Message -------------------------------- */
	
	public static String required() {
		return REQUIRED_MSG;
	}
	
	public static String greaterThan(Object val) {
		return String.format(GREATER_THAN_MSG, val);
	}
	
	public static String greaterThanOrEqualTo(Object val) {
		return String.format(GREATER_THAN_OR_EQUAL_TO_MSG, val);
	}
	
	public static String mustBeBetween(String s, String e) {
		return String.format(MUSTBE_BETWEEN_MSG, s, e);
	}	
	
	public static String invalid() {
		return INVALID_MSG;
	}
	
	public static String invalid(String reason) {
		return String.format(INVALID2_MSG, reason);
	}
	
	public static String cannotDelete() {
		return CANNOT_DELETE_MSG;
	}	
	
	public static String cannotDelete(String reason) {
		return CANNOT_DELETE_MSG + " (" + reason + ")";
	}	
	
	public static String nthRow(int n) {
		return String.format(GREATER_THAN_OR_EQUAL_TO_MSG, n);
	}
	
	public static String notDefined(Object val) {
		return String.format(NOT_DEFINED_MSG, val);
	}
	
	public static String mustBeArray() {
		return MUSTBE_ARRAY_MSG;
	}
	
	
	/* Valid Check -------------------------------- */	
	
	public static boolean isInvalidDd(String dateStr) {
		return !isValidDd(dateStr);
	}
	
	public static boolean isInvalidDt(String dateStr) {
		return !isValidDt(dateStr);
	}
	
	public static boolean isInvalidYear(String dateStr) {
		return !isValidYear(dateStr);
	}
	
	public static boolean isInvalidYearMonth(String dateStr) {
		return !isValidYearMonth(dateStr);
	}
	
	public static boolean isInvalidDate(String dateStr, String format) {
		return !isValidDate(dateStr, format);
	}	
	
	public static boolean isValidDd(String dateStr) {
    	if (StringUtils.isBlank(dateStr)) return false;		
        try {
        	SDF_DD.setLenient(false);
        	SDF_DD.parse(dateStr);
        } catch (ParseException e) {
            return false;
        }
        return true;		
	}	
	
	public static boolean isValidDt(String dateStr) {
    	if (StringUtils.isBlank(dateStr)) return false;			
        try {
        	SDF_DT.setLenient(false);
        	SDF_DT.parse(dateStr);
        } catch (ParseException e) {
            return false;
        }
        return true;		
	}	
	
	public static boolean isValidYear(String dateStr) {
    	if (StringUtils.isBlank(dateStr)) return false;			
        try {
        	SDF_YEAR.setLenient(false);
        	SDF_YEAR.parse(dateStr);
        } catch (ParseException e) {
            return false;
        }
        return true;		
	}
	
	public static boolean isValidYearMonth(String dateStr) {
    	if (StringUtils.isBlank(dateStr)) return false;			
        try {
        	SDF_YEARMONTH.setLenient(false);
        	SDF_YEARMONTH.parse(dateStr);
        } catch (ParseException e) {
            return false;
        }
        return true;		
	}
	
	public static boolean isValidDate(String dateStr, String format) {
    	if (StringUtils.isBlank(dateStr)) return false;	
    	if (StringUtils.isBlank(format)) return false;	    	
        try {
            DateFormat sdf = new SimpleDateFormat(format);
            sdf.setLenient(false);        	
            sdf.parse(dateStr);
        } catch (ParseException e) {
            return false;
        }
        return true;		
	}
	
	public static boolean isValidURL(String url) {
	    try {
	        new URL(url).toURI();
	        return true;
	    } catch (MalformedURLException | URISyntaxException e) {
	        return false;
	    }
	}
	
	public static boolean isDouble(String numberStr) {
    	if (StringUtils.isBlank(numberStr)) return false;
		try {
            Double.parseDouble(numberStr);
        } catch (NumberFormatException e) {
            return false;
        }
        return true;
	}
	
	public static boolean isInteger(String numberStr) {
    	if (StringUtils.isBlank(numberStr)) return false;
		try {
			Integer.parseInt(numberStr);
        } catch (NumberFormatException e) {
            return false;
        }
        return true;
	}
	
	public static boolean isLong(String numberStr) {
    	if (StringUtils.isBlank(numberStr)) return false;
		try {
			Long.parseLong(numberStr);
        } catch (NumberFormatException e) {
            return false;
        }
        return true;
	}
	
	public static boolean isFloat(String numberStr) {
    	if (StringUtils.isBlank(numberStr)) return false;
		try {
			Float.parseFloat(numberStr);
        } catch (NumberFormatException e) {
            return false;
        }
        return true;
	}
	
	public static boolean isBoolean(String str) {
    	if (StringUtils.isBlank(str)) return false;
		try {
			Boolean.parseBoolean(str);
        } catch (NumberFormatException e) {
            return false;
        }
        return true;
	}
	
	/**
	 * <pre>
	 * '-'기호, 0~9 와 소숫점만 으로 표현된 숫자인지 여부
	 * 
	 * NumberUtils.isParsable 기능
	 * 
	 *   Integer.parseInt
	 * , Long.parseLong
	 * , Double.parseDouble
	 * , Float.parseFloat 중 하나 되는 것
	 * </pre> 
	 */
	public static boolean isNumeric(String numberStr) {
		return NumberUtils.isParsable(numberStr);
	}

	public static boolean isArray(Object obj) {
		if (obj == null) return false;
		return obj.getClass().isArray();
	}
	
	public static boolean isList(Object obj) {
		if (obj == null) return false;
		if (obj instanceof List) return true;
		if (obj instanceof List<?>) return true;
		return false;
	}
	
	/* Generate Millis Based Key -------------------------------- */
	
	/**
	 * "prefix1691556566896001" 형식의 ID 반환
	 */
	public static String generateKey(String prefix) {
		if (prefix == null) prefix = "";
		return String.format("%s%d%03d", prefix, System.currentTimeMillis(), getKeyIndex());
	}
	
	/**
	 * "prefix1691556566896000001" 형식의 ID 반환 (indexLen 6인 경우)
	 */
	public static String generateKey(String prefix, int index, int indexLen) {
		if (prefix == null) prefix = "";
		return String.format("%s%d%0" + indexLen + "d", prefix, System.currentTimeMillis(), index);
	}
	
	/**
	 * "1691556566896_00001_local_10" 형식의 ID 반환
	 */
	public static String generateLogKey() {
		return String.format("%d_%05d_%s_%d", System.currentTimeMillis(), getLogKeyIndex(), springProfilesActive, Thread.currentThread().getId());
	}
	
	/**
	 * "1691556566896_1_local_10" 형식의 ID 반환
	 */
	public static String generateLogKey(int index) {
		return String.format("%d_%d_%s_%d", System.currentTimeMillis(), index, springProfilesActive, Thread.currentThread().getId());
	}
	
	/**
	 * "1691556566896_000001_local_10" 형식의 ID 반환 (indexLen 6인 경우)
	 */
	public static String generateLogKey(int index, int indexLen) {
		return String.format("%d_%0" + indexLen + "d_%s_%d", System.currentTimeMillis(), index, springProfilesActive, Thread.currentThread().getId());
	}
	
	/**
	 * "prefix1691556566896_00001_local_10" 형식의 ID 반환
	 */
	public static String generateLogKey(String prefix) {
		if (prefix == null) prefix = "";
		return String.format("%s%d_%05d_%s_%d", prefix, System.currentTimeMillis(), getLogKeyIndex(), springProfilesActive, Thread.currentThread().getId());
	}
	
	/**
	 * "prefix1691556566896_1_local_10" 형식의 ID 반환
	 * @return
	 */
	public static String generateLogKey(String prefix, int index) {
		if (prefix == null) prefix = "";
		return String.format("%s%d_%d_%s_%d", prefix, System.currentTimeMillis(), index, springProfilesActive, Thread.currentThread().getId());
	}
	
	/**
	 * "prefix1691556566896_000001_local_10" 형식의 ID 반환 (indexLen 6인 경우)
	 */
	public static String generateLogKey(String prefix, int index, int indexLen) {
		if (prefix == null) prefix = "";
		return String.format("%s%d_%0" + indexLen + "d_%s_%d", prefix, System.currentTimeMillis(), index, springProfilesActive, Thread.currentThread().getId());
	}
	
}