package com.stoneitgt.dt.data.platform.util;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAccessor;
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

        // ZonedDateTime 객체를 yyyy-MM-dd'T'HH:mm:ss.000'Z' 형태의 String으로 포맷팅
        // String formattedDateTime = zonedDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"));
        String formattedDateTime = zonedDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.000'Z'"));
        return formattedDateTime;
    }

    public static final DateTimeFormatter FLEX_TS =
            new DateTimeFormatterBuilder()
                    .appendPattern("yyyy-MM-dd HH:mm:ss")
                    .optionalStart()
                    .appendFraction(ChronoField.NANO_OF_SECOND, 1, 9, true) // .S ~ .nnnnnnnnn
                    .optionalEnd()
                    .toFormatter();

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

    private static boolean hasTimeFields(DateTimeFormatter formatter) {
        // formatter.toString()은 구현에 따라 패턴이 안 나올 수 있어
        // 호출부가 포맷 문자열을 줄 수 있으면 그걸 검사하는 게 가장 안전합니다.
        String s = formatter.toString();
        return s.contains("H") || s.contains("h") || s.contains("m") || s.contains("s");
    }

    private static LocalDateTime parseToLDT(String text, DateTimeFormatter fmt) {
        try {
            // 시간 필드가 있으면 그대로 LocalDateTime으로
            if (hasTimeFields(fmt)) {
                return LocalDateTime.parse(text, fmt);
            }
            // 시간 필드가 없으면 LocalDate로 파싱 후 00:00:00
            return LocalDate.parse(text, fmt).atStartOfDay();
        } catch (DateTimeException e) {
            // 포맷터 정보가 모호한 경우를 대비한 최후의 폴백(날짜+옵셔널 시간 허용)
            DateTimeFormatter FLEX = new DateTimeFormatterBuilder()
                    .appendPattern("yyyy-MM-dd")
                    .optionalStart().appendLiteral(' ').appendPattern("HH[:mm[:ss]]").optionalEnd()
                    .parseDefaulting(ChronoField.HOUR_OF_DAY, 0)
                    .parseDefaulting(ChronoField.MINUTE_OF_HOUR, 0)
                    .parseDefaulting(ChronoField.SECOND_OF_MINUTE, 0)
                    .toFormatter();
            return LocalDateTime.parse(text, FLEX);
        }
    }

    public static long getDuration(String current, String compare, DateTimeFormatter formatter) {
        DateTimeFormatter fmt = (formatter != null)
                ? formatter
                : DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        LocalDateTime a = parseToLDT(current, fmt);
        LocalDateTime b = parseToLDT(compare, fmt);

        return Duration.between(a, b).getSeconds(); // 음수일 수도 있음(의도에 맞게 절대값 필요하면 Math.abs)
    }

    public static long getPastDuration(String pastCompare, DateTimeFormatter formatter) {
        if (formatter == null) {
            formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        }
        LocalDateTime currentDateTime = LocalDateTime.now();
        LocalDateTime compareDateTime = LocalDateTime.parse(pastCompare, formatter);
        return Duration.between(compareDateTime, currentDateTime).getSeconds();
    }

    public static final DateTimeFormatter FLEX =
            new DateTimeFormatterBuilder()
                    .appendPattern("yyyy-MM-dd")
                    .optionalStart()
                    .appendLiteral(' ')
                    .appendPattern("HH:mm[:ss]")
                    .optionalEnd()
                    .parseDefaulting(ChronoField.HOUR_OF_DAY, 0)
                    .parseDefaulting(ChronoField.MINUTE_OF_HOUR, 0)
                    .parseDefaulting(ChronoField.SECOND_OF_MINUTE, 0)
                    .toFormatter();

    private static final DateTimeFormatter OUT_TS =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 입력이 "yyyy-MM-dd", "yyyy-MM-dd HH:mm[:ss][.n]" 모두일 때
     * 문자열을 일관된 "yyyy-MM-dd HH:mm:ss"로 변환 (null-safe)
     */
    public static String toStandardTsString(String input) {
        if (input == null || input.isEmpty()) return null;
        TemporalAccessor ta = FLEX_TS.parse(input);
        LocalDateTime ldt = ta.isSupported(ChronoField.HOUR_OF_DAY)
                ? LocalDateTime.from(ta)
                : LocalDate.from(ta).atStartOfDay();
        return OUT_TS.format(ldt);
    }

    public static String toStandardLDString(String input) {
        if (input == null || input.isEmpty()) return null;
        TemporalAccessor ta = FLEX.parse(input); // <-- FLEX_TS 대신 FLEX 사용
        LocalDateTime ldt = ta.isSupported(ChronoField.HOUR_OF_DAY)
                ? LocalDateTime.from(ta)
                : LocalDate.from(ta).atStartOfDay(); // yyyy-MM-dd면 00:00:00 부여
        return OUT_TS.format(ldt); // "yyyy-MM-dd HH:mm:ss"
    }

    public static LocalDateTime parseStartOf(String s) {
        // 날짜만이면 00:00:00, 시간이 있으면 그대로
        return LocalDateTime.parse(s, FLEX);
    }

    public static LocalDateTime parseEndOf(String s) {
        if (s.length() == 10) { // "yyyy-MM-dd"
            return LocalDate.parse(s, DateTimeFormatter.ISO_LOCAL_DATE).atTime(LocalTime.MAX);
        }
        return LocalDateTime.parse(s, FLEX);
    }

    public static boolean isDateInRangeFlexible(String date, String fromDate, String toDate) {
        LocalDateTime d = parseStartOf(date);
        LocalDateTime from = parseStartOf(fromDate);
        LocalDateTime to = parseEndOf(toDate);
        return (!d.isBefore(from)) && (!d.isAfter(to)); // from <= d <= to
    }
}