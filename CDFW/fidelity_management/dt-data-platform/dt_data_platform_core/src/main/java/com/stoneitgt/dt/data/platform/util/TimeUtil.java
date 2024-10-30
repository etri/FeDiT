package com.stoneitgt.dt.data.platform.util;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class TimeUtil {
    public static String getCurrentDate() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    public static String getCurrentDateTime() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    public static String getCurrentDayAtMidnight() {
        // 현재 날짜와 시간을 ZonedDateTime 객체로 가져옴 (UTC 시간대)
        ZonedDateTime zonedDateTime = ZonedDateTime.now(ZoneOffset.UTC)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);

        // ZonedDateTime 객체를 yyyy-MM-dd'T'HH:mm:ss'Z' 형태의 String으로 포맷팅
        String formattedCurrentDay = zonedDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"));
        return formattedCurrentDay;
    }

    public static String getNextDayAtMidnight() {
        // 현재 날짜와 시간을 ZonedDateTime 객체로 가져옴 (UTC 시간대)
        ZonedDateTime zonedDateTime = ZonedDateTime.now(ZoneOffset.UTC)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);

        // ZonedDateTime 객체에 하루를 더해 다음 날로 설정
        ZonedDateTime nextDay = zonedDateTime.plusDays(1);

        // ZonedDateTime 객체를 yyyy-MM-dd'T'HH:mm:ss'Z' 형태의 String으로 포맷팅
        String formattedNextDay = nextDay.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"));
        return formattedNextDay;
    }

    public static String parseToYYYYMMDDHHMMSSFromZoneDateTime(String yyyyMMddHHmmss) {
        // yyyy-MM-dd HH:mm:ss 형태의 String을 LocalDateTime 객체로 변환
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        LocalDateTime localDateTime = LocalDateTime.parse(yyyyMMddHHmmss, formatter);

        // LocalDateTime 객체를 ZonedDateTime 객체로 변환하여 UTC 시간대 설정
        ZonedDateTime zonedDateTime = localDateTime.atZone(ZoneOffset.UTC);

        // ZonedDateTime 객체를 yyyy-MM-dd'T'HH:mm:ss'Z' 형태의 String으로 포맷팅
        String formattedDateTime = zonedDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"));
        return formattedDateTime;
    }

    public static String parseToYYYYMMDDHHMMSS(boolean endOfDay, String yyyyMMdd) {
        // yyyy-MM-dd 형태의 String을 LocalDate 객체로 변환
        LocalDate date = LocalDate.parse(yyyyMMdd);
        LocalDateTime dateTime;
        if (endOfDay) {
            // LocalDate 객체를 LocalDateTime 객체로 변환, 시간은 23:59:59로 설정
            dateTime = date.atTime(23, 59, 59);
        } else {
            // LocalDate 객체를 LocalDateTime 객체로 변환, 시간은 00:00:00로 설정
            dateTime = date.atStartOfDay();
        }

        // LocalDateTime 객체를 yyyy-MM-dd HH:mm:ss 형태의 String으로 포맷팅
        String formattedDateTime = dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        return formattedDateTime;
    }

    public static String parseToYYYYMMDDHHMMSSAtCurrent(boolean endOfDay, String yyyyMMdd) {
        // yyyy-MM-dd 형태의 String을 LocalDate 객체로 변환
        LocalDate date = LocalDate.parse(yyyyMMdd);
        LocalTime currentTime = LocalTime.now();

        LocalDateTime dateTime;
        if (endOfDay) {
            // LocalDate 객체를 LocalDateTime 객체로 변환, 시간은 23:59:59로 설정
            dateTime = date.atTime(23, 59, 59);
        } else {
            // LocalDate 객체를 LocalDateTime 객체로 변환, 시간은 현재 시간으로 설정
            dateTime = date.atTime(currentTime);
        }

        // LocalDateTime 객체를 yyyy-MM-dd HH:mm:ss 형태의 String으로 포맷팅
        String formattedDateTime = dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        return formattedDateTime;
    }

    /**
     * 두 날짜 문자열을 비교하여 toDate가 compareDate와 같거나 이후인지 확인하는 메서드.
     *
     * @param toDateStr      비교할 현재 날짜 및 시간 문자열 (형식: "yyyy-MM-dd HH:mm:ss")
     * @param compareDateStr 비교할 기준 날짜 및 시간 문자열 (형식: "yyyy-MM-dd HH:mm:ss")
     * @return toDate가 compareDate와 같거나 이후이면 false를 반환하고, 그렇지 않으면 true를 반환
     */
    public static boolean compareAfterDate(String toDateStr, String compareDateStr) {
        // DateTimeFormatter 설정
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        // String을 LocalDateTime 객체로 변환
        LocalDateTime toDate = LocalDateTime.parse(toDateStr, formatter);
        LocalDateTime compareDate = LocalDateTime.parse(compareDateStr, formatter);

        // 현재 시간이 비교시간을 같거나 넘어갔는지 확인
        if (toDate.isEqual(compareDate) || toDate.isAfter(compareDate)) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * 주어진 문자열이 유효한 시간 포맷인지 확인하는 메서드.
     *
     * @param dateTimeStr 확인할 문자열
     * @return 문자열이 유효한 시간 포맷이면 true, 그렇지 않으면 false
     */
    public static boolean isValidDateTime(String dateTimeStr) {
        // DateTimeFormatter 설정: "yyyy-MM-dd HH:mm:ss" 형식으로 문자열을 변환하기 위한 포맷터
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        try {
            // 문자열을 LocalDateTime 객체로 변환 시도
            LocalDateTime.parse(dateTimeStr, formatter);
            return true; // 변환 성공하면 유효한 시간 포맷
        } catch (DateTimeParseException e) {
            e.printStackTrace();
            return false; // 변환 실패하면 유효하지 않은 시간 포맷
        }
    }
}
