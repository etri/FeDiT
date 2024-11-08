package com.stoneitgt.dt.data.platform.util;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import org.json.JSONArray;
import org.json.JSONException;
import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;

import kong.unirest.Unirest;
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
            JSONArray jsonArray = new JSONArray(jsonString);
            String[] array = new String[jsonArray.length()];
            for (int i = 0; i < jsonArray.length(); i++) {
                array[i] = jsonArray.getString(i);
            }
            return array;
        } catch (JSONException e) {
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
