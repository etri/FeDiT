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

    //현재 실행 중인 메서드의 이름
    public static String getMethodName() {
        return Thread.currentThread().getStackTrace()[1].getMethodName();
    }

    public static String[] splitString(String input) {
        //log.info("spli진입:::::");
        String[] parts;

        int dotCount = countDots(input);

        if (input.contains(".")) {
            parts = input.split("\\.(?=[^.]+$)");
            parts = Arrays.copyOf(parts, parts.length + 1);
            parts[2] = String.valueOf(dotCount + 1);
        } else {
            parts = new String[3];
            parts[0] = null;
            parts[1] = input;
            parts[2] = "1";
        }

        //log.info("parts진입:::::" + parts);

        return parts;
    }

    public static int countDots(String input) {
        int count = 0;
        for (int i = 0; i < input.length(); i++) {
            if (input.charAt(i) == '.') {
                count++;
            }
        }
        return count;
    }

    // 리스트 비교 메소드
    public static boolean compareLists(List<Map<String, Object>> list1, List<Map<String, Object>> list2, String key1, String key2) {
        for (Map<String, Object> queryItem : list1) {
            String queryValue = (String) queryItem.get(key1);
            boolean found = false;
            for (Map<String, Object> jsonItem : list2) {
                String jsonKey = (String) jsonItem.get(key2);
                if (queryValue.equals(jsonKey)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        return true;
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

    public static Map<String, Object> readCSV(String filePath, String fileName, int limit) throws IOException {
        String csvFile = filePath + "/" + fileName; // 전체 파일 경로 생성

        log.info("csvFile:::" + csvFile);

        List<String> headerList = new ArrayList<>(); // 헤더를 담을 리스트
        List<List<String>> dataList = new ArrayList<>(); // 데이터를 담을 리스트
        //List<Map<String, Object>> dataList = new ArrayList<Map<String, Object>>();

        try (FileReader fileReader = new FileReader(csvFile); BufferedReader br = new BufferedReader(fileReader)) {
            String line;
            boolean isFirstLine = true;
            int rowCount = 0;
            if (limit > 0) {
                while ((line = br.readLine()) != null && rowCount < limit) {
                    String[] values = line.split(","); // CSV 파일을 쉼표로 분리하여 배열에 저장
                    if (isFirstLine) {
                        for (String value : values) {
                            headerList.add(value); // 첫 번째 행은 헤더로 저장
                        }
                        isFirstLine = false;
                    } else {
                        List<String> rowData = new ArrayList<>();
                        for (int i = 0; i < values.length; i++) {
                            rowData.add(values[i]);
                        }
                        dataList.add(rowData);
                        rowCount++; // 행 카운터 증가
                    }
                }
            } else {
                while ((line = br.readLine()) != null) {
                    String[] values = line.split(","); // CSV 파일을 쉼표로 분리하여 배열에 저장
                    if (isFirstLine) {
                        for (String value : values) {
                            headerList.add(value); // 첫 번째 행은 헤더로 저장
                        }
                        isFirstLine = false;
                    } else {
                        List<String> rowData = new ArrayList<>();
                        for (String value : values) {
                            rowData.add(value); // 나머지 행은 데이터로 저장
                        }
                        dataList.add(rowData);
                    }
                }
            }
        }

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("header_list", headerList);
        resultMap.put("data_list", dataList);
        return resultMap;
    }
}
