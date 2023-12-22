package com.stoneitgt.dt.data.platform.util;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.stoneitgt.dt.data.platform.domain.Paging;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ConvertUtil {
	
	public static Paging setTotalPaging(List<Map<String, Object>> list, Paging paging) {
		if (list.size() > 0) {
			int total = Integer.valueOf(list.get(0).get("total_count").toString());
			paging.setTotal(total);
		} else {
			paging.setTotal(0);
		}
		return paging;
	}
	
	//운영서버 maria db 버전이 낮아 전체 count 별도 처리
	public static Paging setTotalPaging(int cnt, Paging paging) {
		if (cnt > 0) {
			int total = Integer.valueOf(cnt);
			paging.setTotal(total);
		} else {
			paging.setTotal(0);
		}
		return paging;
	}
	
	//오브젝트를 맵형태로 변환, 키값을 언더바 형태로
	@SuppressWarnings("unchecked")
	public static Map<String, Object> convertValueToMap(Object obj) {
		ObjectMapper mapper = new ObjectMapper();
		mapper.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE);
		return mapper.convertValue(obj, Map.class);
	}

}
