package com.stoneitgt.dt.data.platform.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * Stone Util
 *
 * @author yh.kim
 */
@Slf4j
public class MetaRelateUtil {
    public static String generateFileNameTime(String param) {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter;

        if ("D".equals(param)) {
            formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        } else if ("H".equals(param)) {
            formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        } else {
            throw new IllegalArgumentException("Invalid parameter");
        }

        return now.format(formatter);
    }

    public static String[] parseJSONStringToArray(String jsonString) {
        try {
            JsonNode jsonArray = new ObjectMapper().readTree(jsonString);
            if (jsonArray == null || !jsonArray.isArray()) {
                return new String[0]; // 배열 형식이 아니면 빈 배열 반환
            }
            String[] array = new String[jsonArray.size()];
            for (int i = 0; i < jsonArray.size(); i++) {
                array[i] = jsonArray.get(i).asText();
            }
            return array;
        } catch (Exception e) {
            // 파싱 실패(JsonProcessingException)는 checked 예외이므로 Exception 으로 받는다
            e.printStackTrace();
            return new String[0]; // 예외 발생 시 빈 배열 반환
        }
    }

    public static int findDateIndex(List<String> headers, String dateKey) {
        int dateIndex = -1;
        //시간 키 인덱스 구하기
        for (int i = 0; i < headers.size(); i++) {
            if (Objects.equals(headers.get(i).replaceAll("\"", ""), dateKey.replaceAll("\"", ""))) {
                dateIndex = i;
            }
        }
        if (dateIndex == -1) {
            dateIndex = 0;
        }
        return dateIndex;
    }
}
