package com.stoneitgt.dt.data.platform.util;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

public class TimeUtil {
    public static String getCurrentDateTime() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    public static long getCurrentTimeMillis() {
        return System.currentTimeMillis();
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
        if (Objects.equals("yyyy-MM-dd HH:mm:ss", ConvertUtil.tryParseFindFormat(ConvertUtil.DATEFORMATS, yyyyMMdd))) {
            return yyyyMMdd;
        }
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

    public static String formatZonedDateTimeStringToDateTimeFormat(String yyyyMMddTHHmmssZ) {
        // ZonedDateTime으로 파싱
        ZonedDateTime zonedDateTime = ZonedDateTime.parse(yyyyMMddTHHmmssZ);
        // 포맷 지정
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        // 포맷 적용하여 문자열로 변환
        return zonedDateTime.format(formatter);
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

    public static String minusTime(String format, String inputTime, String timeType, int interval) {
        if (format == null || format.isEmpty()) {
            format = "yyyy-MM-dd HH:mm:ss";
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
        ZonedDateTime zonedDateTime = ZonedDateTime.parse(inputTime, formatter.withZone(ZoneId.systemDefault()));

        switch (timeType) {
            case "MS":
                zonedDateTime = zonedDateTime.minusNanos(interval);
                break;
            case "S":
                zonedDateTime = zonedDateTime.minusSeconds(interval);
                break;
            case "M":
            case "T":
                zonedDateTime = zonedDateTime.minusMinutes(interval);
                break;
            case "H":
                zonedDateTime = zonedDateTime.minusHours(interval);
                break;
            case "D":
                zonedDateTime = zonedDateTime.minusDays(interval);
                break;
            case "m":
                zonedDateTime = zonedDateTime.minusMonths(interval);
                break;
            default:
                System.out.println("Unsupported type");
                break;
        }
        return formatter.format(zonedDateTime);
    }

    public static String plusTime(String format, String inputTime, String timeType, int interval) {
        if (format == null || format.isEmpty()) {
            format = "yyyy-MM-dd HH:mm:ss";
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
        ZonedDateTime zonedDateTime = ZonedDateTime.parse(inputTime, formatter.withZone(ZoneId.systemDefault()));

        switch (timeType) {
            case "MS":
                zonedDateTime = zonedDateTime.plus(interval, ChronoUnit.MILLIS);
                break;
            case "S":
                zonedDateTime = zonedDateTime.plus(interval, ChronoUnit.SECONDS);
                break;
            case "M":
            case "T":
                zonedDateTime = zonedDateTime.plus(interval, ChronoUnit.MINUTES);
                break;
            case "H":
                zonedDateTime = zonedDateTime.plus(interval, ChronoUnit.HOURS);
                break;
            case "D":
                zonedDateTime = zonedDateTime.plus(interval, ChronoUnit.DAYS);
                break;
            default:
                System.out.println("Unsupported type");
                break;
        }
        return formatter.format(zonedDateTime);
    }

    public static long getDuration(String current, String compare, DateTimeFormatter formatter) {
        if (formatter == null) {
            formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        }
        LocalDateTime currentDateTime = LocalDateTime.parse(current, formatter);
        LocalDateTime compareDateTime = LocalDateTime.parse(compare, formatter);
        return Duration.between(currentDateTime, compareDateTime).getSeconds();
    }

    public static long getPastDuration(String pastCompare, DateTimeFormatter formatter) {
        if (formatter == null) {
            formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        }
        LocalDateTime currentDateTime = LocalDateTime.now();
        LocalDateTime compareDateTime = LocalDateTime.parse(pastCompare, formatter);
        return Duration.between(compareDateTime, currentDateTime).getSeconds();
    }
}