package kr.co.n2m.platform.meta.architecture.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang3.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * 날짜, 시간 Util
 * 
 * @author  n2m
 */
@Slf4j
public class DateUtil {
	
	public static final String DATE_FORMAT_DD         = "yyyy-MM-dd";
	public static final String DATE_FORMAT_DT         = "yyyy-MM-dd HH:mm:ss";
	public static final String DATE_FORMAT_DT3        = "yyyy-MM-dd HH:mm:ss.SSS";
//	public static final String DATE_FORMAT_ISO        = "yyyy-MM-dd'T'HH:mm:ss";
//	public static final String DATE_FORMAT_ISO3  	  = "yyyy-MM-dd'T'HH:mm:ss.SSS";
	public static final String DATE_FORMAT_ISOZ       = "yyyy-MM-dd'T'HH:mm:ssXXXXX"; // XXXXX 출력 포맷 경우만
	
	// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정. XXXXX -> 'Z' 표시됨. +09:00 표시됨
	// ex) 2024-01-17T17:13:40.123456Z, 2024-01-18T02:13:40.123456+09:00
	public static final String DATE_FORMAT_ISO6Z 	  = "yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXXXX"; // XXXXX 출력 포맷 경우만
	
	public static final String DATA_FORMAT_POSTGRESQL_DT  = "yyyy-MM-dd HH:mm:ss";
	
	// 끝에 붙은 타임존만 인식: Z, UTC, ±HH[:MM] or ±HHMM or ±HH
	public static final Pattern TIMEZONE_TAIL = Pattern.compile("\\s*(Z|UTC|[+-]\\d{2}(?::?\\d{2})?)$");  
    
    /**
     * <pre>
     * 날짜형식 문자열을 원하는 format 문자열로 변환 (LocalDateTime) 
     * 
     * 예) 2023-01-13 17:20:55  -> 20230113172055
     * 예) 2023-01-13+01:00     -> 2023-01-13 08:00:00
     * 예) 2023-01-13 17:20:55Z -> 2023-01-14 02:20:55
     * </pre>
     */
	public static String toStr(String dateStr, String format) throws IllegalArgumentException {
		return toStr(toLocalDateTime(dateStr), format);
	}
    
    public static String toStr(LocalDateTime date, String format) {
    	return DateTimeFormatter.ofPattern(format).format(date);
    }  
    
    public static String toStr(Date date, String format) {
    	return toStr(toLocalDateTime(date), format);
    }      
    
    /**
     * <pre>
     * 날짜형식 문자열을 원하는 "yyyy-MM-dd HH:mm:ss" 문자열로 변환 (LocalDateTime) 
     * 
     * 예) 20230113172055 -> 2023-01-13 17:20:55
     * </pre>
     */    
	public static String toStr(String dateStr) throws IllegalArgumentException {
		return toStr(toLocalDateTime(dateStr), DATE_FORMAT_DT);
	}

    public static String toStr(LocalDateTime date) {
    	return toStr(date, DATE_FORMAT_DT);
    }

    public static String toStr(Date date) {
    	return toStr(toLocalDateTime(date), DATE_FORMAT_DT);
    }
    
    /**
     * <pre>
     * 날짜형식 문자열을  ISO 8601 "yyyy-MM-dd'T'HH:mm:ssXXXXX" 문자열로 변환
     * 
     * 예) 2023-01-13          -> 2023-01-13T00:00:00+09:00
     * 예) 2023-01-13 17:20:55 -> 2023-01-13T17:20:55+09:00
     * </pre>
     */
    public static String toISOTimeStr(String dateStr) throws IllegalArgumentException {
    	ZonedDateTime zonedDateTime = ZonedDateTime.of(toLocalDateTime(dateStr), ZoneId.systemDefault());
    	return DateTimeFormatter.ofPattern(DATE_FORMAT_ISOZ).format(zonedDateTime);
    }
    
    /**
     * toISOTimeStr 하기 전 가능한지 체크
     * 
     * @param dateStr
     * @return
     */
    public static boolean isISOTime(String dateStr) {
    	if (StringUtils.isEmpty(dateStr)) return false;
    	try {
    		toISOTimeStr(dateStr);
    	} catch (IllegalArgumentException e) {
    		return false;
    	}
    	return true;
    }
    
    // 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
    public static String toISO6TimeStr(String dateStr) throws IllegalArgumentException {
    	ZonedDateTime zonedDateTime = ZonedDateTime.of(toLocalDateTime(dateStr), ZoneId.systemDefault());
    	return DateTimeFormatter.ofPattern(DATE_FORMAT_ISO6Z).format(zonedDateTime);
    }
    
    public static boolean isISO6Time(String dateStr) {
    	if (StringUtils.isEmpty(dateStr)) return false;
    	try {
    		toISO6TimeStr(dateStr);
    	} catch (IllegalArgumentException e) {
    		return false;
    	}
    	return true;
    }    

    /**
     * 날짜형식 문자열을  LocalDateTime 으로 변환 (Custom Parsing)
     */
    public static LocalDateTime toLocalDateTime(String dateStr) throws IllegalArgumentException {
    	if (StringUtils.isBlank(dateStr)) throw new IllegalArgumentException("dateStr is required.");
    	
    	LocalDateTime localDateTime = null;
    	String pattern = "";
    			
		try {
			String tempStr = dateStr.replace("\"", "").replace("'", ""); // 큰따옴표나 작은따옴표 있다면 제거
	    	ZoneId zoneId = ZoneId.systemDefault(); // "Asia/Seoul"
	    	
    		// "+", "-", "Z", "UTC" 이 존재한다면 Zone 정보가 있다고 보고 따로 zoneId를  구한다. 그 외의 경우는 직접 formatter 지정해서 변환할 것!
	        Matcher m = TIMEZONE_TAIL.matcher(dateStr);
	        if (m.find() && m.start() >= 8) {
	            String offsetStr = m.group(1);
	            if ("Z".equals(offsetStr)) offsetStr = "UTC";
	            zoneId = ZoneId.of(offsetStr);
	            tempStr = dateStr.substring(0, m.start()).trim(); // 타임존 제거된 본문
	        }

	        // 숫자만 추출해서 패턴 판별(yyyyMMdd[HH[mm[ss[SSS/SSSSSS]]]])
			String time = tempStr.replaceAll("[^0-9]", "");
			//log.debug(dateStr + " -> " + time);
			
			switch (time.length()) {
				case 8:
					time    = time + "00";
					pattern = "yyyyMMddHH";
					break;
				case 10: 
					pattern = "yyyyMMddHH";
					break;
				case 12:
					pattern = "yyyyMMddHHmm";
					break;
				case 14:
					pattern = "yyyyMMddHHmmss";
					break;		
				case 15: case 16: case 17:
					time    = new StringBuilder(time.substring(0, 14)).append(".").append(StringUtils.rightPad(time.substring(14), 3, "0")).toString();
					pattern = "yyyyMMddHHmmss.SSS";
					break;	
				case 18: case 19: case 20:
					time    = new StringBuilder(time.substring(0, 14)).append(".").append(StringUtils.rightPad(time.substring(14), 6, "0")).toString();
					pattern = "yyyyMMddHHmmss.SSSSSS";
					break;						
				default:
					time = null;
					break;	
			}
			
			if (time == null) {
				throw new IllegalArgumentException("date == null");
				
			} else {
				ZonedDateTime zonedDateTime = ZonedDateTime.parse(time, DateTimeFormatter.ofPattern(pattern).withZone(zoneId));
				//log.debug("zonedDateTime : " + zonedDateTime.toString() + " -> " + zonedDateTime.withZoneSameInstant(ZoneId.systemDefault()).toString());
				localDateTime = zonedDateTime.withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();	
				//log.debug("localDateTime : " + localDateTime.toString());
			}
			
		} catch (Exception e) {
			log.error(String.format("[%s]를 날짜 형식으로 변환할 수 없습니다!", dateStr), e.getMessage());
			throw new IllegalArgumentException(String.format("[%s]를 날짜 형식으로 변환할 수 없습니다!", dateStr));
		}
		return localDateTime;
    }
	
    public static LocalDateTime toLocalDateTime(Date date) {
    	return date.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }
    
    public static boolean isDateStr(String dateStr) {
    	try {
    		toLocalDateTime(dateStr);
    		return true;
    	} catch(Exception e) {
    		return false;
    	}
    }

    /**
     * 현재 일자 반환 (yyyy-MM-dd)
     */
    public static String getCurrDate() {
    	return DateTimeFormatter.ofPattern(DATE_FORMAT_DD).format(LocalDate.now());
    }
    
    /**
     * 현재 일시 반환 (yyyy-MM-dd HH:mm:ss)
     */
    public static String getCurrDateTime() {
    	return DateTimeFormatter.ofPattern(DATE_FORMAT_DT).format(LocalDateTime.now());
    }
    
    /**
     * 현재 일시 반환 (yyyy-MM-dd'T'HH:mm:ssXXXXX)
     */
    public static String getCurrISOTime() {
    	ZonedDateTime zonedDateTime = ZonedDateTime.of(LocalDateTime.now(), ZoneId.systemDefault());
    	return DateTimeFormatter.ofPattern(DATE_FORMAT_ISOZ).format(zonedDateTime);    	
    }
    
    /**
     * 현재 일시 반환 (yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXXXX)
     * @return
     */
    public static String getCurrISO6Time() {
    	ZonedDateTime zonedDateTime = ZonedDateTime.of(LocalDateTime.now(), ZoneId.systemDefault());
    	return DateTimeFormatter.ofPattern(DATE_FORMAT_ISO6Z).format(zonedDateTime);    	
    }
    
    /**
     * 현재 UTC 일시 반환 (ISO 8601 + 마이크로초 6자리 + Z)
     * ex) 2024-01-17T08:13:40.123456Z
     */
    public static String getCurrUTCISO6Time() {
        ZonedDateTime utcNow = ZonedDateTime.now(ZoneOffset.UTC);
        return DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'").format(utcNow);
    }
    
    /**
     * 현재 일시 반환 (format)
     */
    public static String getCurrDateTime(String format) {
    	return DateTimeFormatter.ofPattern(format).format(LocalDateTime.now());
    }

    /**
     * 날짜형식 문자열을 Unix 초로 반환 ex) 1599567400L
     * @param dateStr
     * @return
     */
    public static long toUnixTimestamp(String dateStr) {
    	LocalDateTime localDateTime = toLocalDateTime(dateStr);
    	return localDateTime.toEpochSecond(getCurrZoneOffset());
    }
    
    /**
     * 현재(시스템) ZoneOffset 반환
     * @return
     */
    public static ZoneOffset getCurrZoneOffset() {
    	ZonedDateTime zonedDateTime = ZonedDateTime.now(ZoneId.systemDefault());
    	return zonedDateTime.getOffset();
    }
    
    /**
     * 날짜형식 문자열을 OffsetDateTime 으로 반환 (초 단위까지. 초 이하(밀리, 마이크로, 나노 등)단위는 다 0 취급)
     * @param dateStr
     * @return
     */
    public static OffsetDateTime toOffsetDateTime(String dateStr) {
    	Instant instant = Instant.ofEpochSecond(toUnixTimestamp(dateStr));
    	return instant.atOffset(getCurrZoneOffset());
    }
    
//    public static void main(String[] args) {
//    	//String dateStr = "2025-02-05T16:57:01";
//    	//System.out.println(dateStr + " -> " + toUnixTimestamp(dateStr) + " -> " + toOffsetDateTime(dateStr));
//    	String[] strs = { "2025-07-30", "2025-07-31T16", "2025-08-01T16:12:45Z", "2025-08-02T17:23:21+09:00", "2025-08-03T10:23:35.234123+09:00" };
//    	for (String s : strs) {
//    		System.out.println(s + " -> " + toISO6TimeStr(s));
//    	}
//    	/*
//    	 	2025-07-30 -> 2025-07-30T00:00:00.000000+09:00
//			2025-07-31T16 -> 2025-07-31T16:00:00.000000+09:00
//			2025-08-01T16:12:45Z -> 2025-08-02T01:12:45.000000+09:00
//			2025-08-02T17:23:21+09:00 -> 2025-08-02T17:23:21.000000+09:00
//			2025-08-03T10:23:35.234123+09:00 -> 2025-08-03T10:23:35.234123+09:00
//    	 */
//    }
}
