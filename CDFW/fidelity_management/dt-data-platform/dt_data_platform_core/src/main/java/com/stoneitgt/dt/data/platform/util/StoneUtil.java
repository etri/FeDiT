package com.stoneitgt.dt.data.platform.util;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.stoneitgt.dt.data.platform.domain.Paging;

import lombok.extern.slf4j.Slf4j;

/**
 * Stone Util
 *
 * @author yh.kim
 *
 */
@Slf4j
public class StoneUtil {
	public static Paging setTotalPaging(List<Map<String, Object>> list, Paging paging) {
		if (list.size() > 0) {
			int total = Integer.valueOf(list.get(0).get("total_count").toString());
			paging.setTotal(total);
		} else {
			paging.setTotal(0);
		}
		return paging;
	}

	public static Paging setTotalPaging2(List<Map<String, Object>> list, Paging paging) {
		if (list.size() > 0) {
			int total = list.size();
			paging.setTotal(total);
		} else {
			paging.setTotal(0);
		}
		return paging;
	}

	public static String getToday() {
		return getToday("yyyyMMdd");
	}

	public static String getToday(String pattern) {
		if (pattern == null || "".equals(pattern)) {
			pattern = "yyyyMMdd";
		}
		SimpleDateFormat sdFormat = new SimpleDateFormat(pattern);
		return sdFormat.format(Calendar.getInstance().getTime());
	}

	@SuppressWarnings("unchecked")
	public static Map<String, Object> convertObjectToMap(Object obj) {
		ObjectMapper mapper = new ObjectMapper();
		mapper.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE);
		return mapper.convertValue(obj, Map.class);
	}

	public static String dateToFormatString(String value) {
		String result = "";
		if (StringUtil.isBlank(value)) {
			return result;
		}
		SimpleDateFormat dateformat = new SimpleDateFormat("yyyyMMdd");
		try {
			Date date = dateformat.parse(value);
			result = new SimpleDateFormat("yyyy-MM-dd").format(date);
		} catch (ParseException e) {
		}
		return result;

	}
}
