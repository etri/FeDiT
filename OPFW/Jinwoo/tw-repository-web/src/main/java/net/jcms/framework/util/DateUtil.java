package net.jcms.framework.util;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class DateUtil {

	/**
	 * 현재 날짜를 yyyy-MM-dd 형식으로 리턴
	 * 
	 * @return
	 */
	public static String getCurrentDay() {
		return getCurrentDay("yyyy-MM-dd");
	}

	/**
	 * 현재 날짜를 패턴형식으로 리턴
	 * 
	 * @param pattern
	 * @return
	 */
	public static String getCurrentDay(String pattern) {
		SimpleDateFormat mSimpleDateFormat = new SimpleDateFormat(pattern, Locale.KOREA);
		Date currentTime = new Date();
		String mTime = mSimpleDateFormat.format(currentTime);
		return mTime;
	}

	public static Date stringToDate(String date, String pattern) throws ParseException {
		SimpleDateFormat transFormat = new SimpleDateFormat(pattern);
		return transFormat.parse(date);
	}

}
