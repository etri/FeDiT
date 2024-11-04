package kr.co.e8ight.ndxpro.databroker.util;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.TimeZone;

public class DataBrokerDateFormat {
    public static final String DATE_TIME_FORMAT_WITH_TIME_ZONE = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";

    public static final String DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS";

    public static final String DATE_FORMAT = "yyyy-MM-dd";

    public static Date formatStringToDate(String format, String date) {
        SimpleDateFormat dateFormat = new SimpleDateFormat(format);
        Date parsedDate = null;
        try {
            parsedDate = dateFormat.parse(date);
        } catch (ParseException e) {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Date parsed fail. Invalid time. time=" + date);
        }
        return parsedDate;
    }

    public static String formatDateToString(String format, Date date) {
        SimpleDateFormat dateFormat = new SimpleDateFormat(format);
        dateFormat.setTimeZone(TimeZone.getTimeZone(ZoneId.systemDefault()));
        return dateFormat.format(date);
    }

    public static Date formatLocalDateToDate(LocalDate date) {
        return Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    public static String parseUTCDateString(String time) {
        SimpleDateFormat dateFormat = new SimpleDateFormat(DATE_TIME_FORMAT);
        Date utcDate = null;
        try {
            utcDate = dateFormat.parse(time);
        } catch (ParseException e) {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Date parsed fail. Invalid time. time=" + time);
        }
        SimpleDateFormat utcDateFormat = new SimpleDateFormat(DATE_TIME_FORMAT);
        utcDateFormat.setTimeZone(TimeZone.getTimeZone(ZoneId.of("UTC")));
        return utcDateFormat.format(utcDate) + "+00:00";
    }
}
