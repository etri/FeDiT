/**
 * 
 */
package kr.udt.data.util;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Calendar;
import java.util.Date;

/**
 * @설명 : 공통 유틸
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2021. 11. 17.
 * @비고 : (static 메소드)
 */
public class UdtCommonUtil {
	
    public static String getStringTimeByFormatter(String timeFormat,Calendar time){
        return new SimpleDateFormat(timeFormat).format(time.getTime());
    }
    
    public static String getStringTimeByFormatter(String timeFormat,long curretTimeMill){
        return new SimpleDateFormat(timeFormat).format(curretTimeMill);
    }
    
    
    public static String getCurrentTimeByFormatter(String timeFormat){
        return new SimpleDateFormat(timeFormat).format(LocalTime.now());
    }
    public static String getBeforeWeekTimeString(String timeFormat,Calendar time, int agoWeek) {
        time.add(Calendar.DATE , (-7*agoWeek));
        String beforeWeek = new java.text.SimpleDateFormat(timeFormat).format(time.getTime());
        //System.out.println(beforeWeek);
        return beforeWeek;
    }
    
    public static String getMondayDateStringOfWeek() {
    	SimpleDateFormat formatter = new java.text.SimpleDateFormat("yyyyMMdd");
    	Calendar c = Calendar.getInstance();
    	c.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);
    	return formatter.format(c.getTime());
    }
    
    public static String getTodayDateString() {
    	return(new SimpleDateFormat("yyyy-MM-dd").format(new Date()));
    }
    
    
    public static String getFridayDateStringOfWeek() {
    	SimpleDateFormat formatter = new java.text.SimpleDateFormat("yyyyMMdd");
    	Calendar c = Calendar.getInstance();
    	c.set(Calendar.DAY_OF_WEEK, Calendar.FRIDAY);
    	return formatter.format(c.getTime());
    }
    
    public static String getStartDayeStringOfMonth() {
    	SimpleDateFormat formatter = new java.text.SimpleDateFormat("yyyyMMdd");
    	LocalDate now = LocalDate.now();
    	Calendar c = Calendar.getInstance();
    	c.set(now.getYear(),now.getMonthValue()-1,1);
    	return formatter.format(c.getTime());
    }
    
    public static String getLastDayeStringOfMonth() {
    	SimpleDateFormat formatter = new java.text.SimpleDateFormat("yyyyMMdd");
    	LocalDate now = LocalDate.now();
    	Calendar c = Calendar.getInstance();
    	c.set(now.getYear(),now.getMonthValue()-1,1);
    	int lastDay = c.getActualMaximum(Calendar.DATE);
    	c.set(now.getYear(),now.getMonthValue()-1,lastDay);
    	return formatter.format(c.getTime());
    }
    
    public static String getCurrentYYYYMM() {
    	SimpleDateFormat formatter = new java.text.SimpleDateFormat("yyyyMM");
    	Calendar c = Calendar.getInstance();
    	return formatter.format(c.getTime());
    }

}
