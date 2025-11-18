package com.stoneitgt.dt.data.platform.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
public class ConvertUtil {

    public static String[] DATEFORMATS = {
            "yyyy-MM-dd HH:mm:ss",
            "yyyy/MM/dd HH:mm:ss",
            "dd-MM-yyyy HH:mm:ss",
            "MM/dd/yyyy HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm:ssZ",
            "yyyy-MM-dd'T'HH:mm:ss.SSSX",
            "yyyy-MM-dd",
            "yyyy/MM/dd"
    };

    public static JsonNode requestBodyParsing(String body) {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            // ResponseEntity의 바디를 문자열로 변환
            String responseBody = body;

            // 문자열을 JSON 객체로 변환
            JsonNode rootNode = objectMapper.readTree(responseBody);

            // 코드, 메시지, 디테일 추출
            int code = rootNode.get("code").asInt();
            String message = rootNode.get("message").asText();
            String detail = rootNode.get("detail").asText();
            //log.info("requestBodyParsing -> " + code + message + detail);

            // data 객체 추출
            JsonNode dataNode = rootNode.get("data");

            return dataNode;
        } catch (JsonMappingException e) {
            throw new RuntimeException(e);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    public static String findDateColumn(List<Map<String, Object>> datas) {
        // 날짜를 파싱할 수 있는 형식을 찾는 함수
        // 'rowtime'의 인덱스를 찾기 (여기서는 첫 번째 날짜 인덱스를 찾기)
        if (datas == null || datas.isEmpty()) {
            return null;
        }
        String key = null;
        Map<String, Object> firstRow = datas.get(0);

        for (Map.Entry<String, Object> entry : firstRow.entrySet()) {
            if (entry.getValue() != null && tryParse(DATEFORMATS, entry.getValue().toString()) != null) {
                key = entry.getKey();
                break;
            }
        }

        if (key == null) {
            return null;
        }
        return key;
    }

    public static String findDateColumn(List<String> headers, List<List<String>> datas) {
        // 날짜를 파싱할 수 있는 형식을 찾는 함수
        // 가능한 날짜 형식들
        // 'rowtime'의 인덱스를 찾기 (여기서는 첫 번째 날짜 인덱스를 찾기)
        if (datas == null || datas.isEmpty()) {
            return null;
        }
        int dateColumnIndex = -1;
        for (int i = 0; i < headers.size(); i++) {
            if (tryParse(DATEFORMATS, datas.get(0).get(i)) != null) {
                dateColumnIndex = i;
                break;
            }
        }

        if (dateColumnIndex == -1) {
            log.warn("No date column found.");
            return null;
        }
        return headers.get(dateColumnIndex).replaceAll("\"", "");
    }

    public static HashMap<String, Object> moveAndReOrderHeaderDatas(List<String> headers, List<List<String>> datas) {
        HashMap<String, Object> hashMap = new HashMap<>();
        List<String> rearrangedHeaders = new ArrayList<>();
        List<List<String>> rearrangedDataList = new ArrayList<>();
        // 날짜를 파싱할 수 있는 형식을 찾는 함수
        // 가능한 날짜 형식들
        // 'rowtime'의 인덱스를 찾기 (여기서는 첫 번째 날짜 인덱스를 찾기)
        if (datas == null || datas.isEmpty()) {
            hashMap.put("headers", rearrangedHeaders);
            hashMap.put("datas", rearrangedDataList);
            return hashMap;
        }
        int dateColumnIndex = -1;
        for (int i = 0; i < headers.size(); i++) {
            if (tryParse(DATEFORMATS, datas.get(0).get(i)) != null) {
                dateColumnIndex = i;
                break;
            }
        }

        if (dateColumnIndex == -1) {
            log.warn("No date column found.");
            return null;
        }

        // headers에서 날짜를 첫 번째 요소로 이동시키기

        rearrangedHeaders.add(headers.get(dateColumnIndex)); // 날짜를 첫 번째로 추가
        for (int i = 0; i < headers.size(); i++) {
            if (i != dateColumnIndex) {
                rearrangedHeaders.add(headers.get(i)); // 나머지 요소 추가
            }
        }

        // 날짜를 첫 번째 요소로 이동시키기
        for (List<String> row : datas) {
            List<String> rearrangedRow = new ArrayList<>();
            rearrangedRow.add(row.get(dateColumnIndex)); // 날짜를 첫 번째로 추가
            for (int i = 0; i < row.size(); i++) {
                if (i != dateColumnIndex) {
                    rearrangedRow.add(row.get(i)); // 나머지 요소 추가
                }
            }
            rearrangedDataList.add(rearrangedRow);
        }

        // rearrangedDataList를 날짜 기준으로 정렬
        Collections.sort(rearrangedDataList, new Comparator<List<String>>() {
            @Override
            public int compare(List<String> a, List<String> b) {
                Date date1 = tryParse(DATEFORMATS, a.get(0)); // 첫 번째 요소는 날짜
                Date date2 = tryParse(DATEFORMATS, b.get(0)); // 첫 번째 요소는 날짜
                return date1.compareTo(date2);
            }
        });
        hashMap.put("headers", rearrangedHeaders);
        hashMap.put("datas", rearrangedDataList);
        return hashMap;
    }

    public static String tryParseFindFormat(String[] dateFormats, String dateString) {
        for (String format : dateFormats) {
            try {
                if (dateString != null && dateString.length() != 0) {
                    dateString = dateString.replaceAll("\"", "");
                    new SimpleDateFormat(format).parse(dateString);
                    return format;
                }
            } catch (ParseException e) {
                // 무시하고 다음 형식 시도
                continue;
            }
        }
        // 어떤 형식에도 맞지 않으면 null 반환
        return null;
    }

    public static Date tryParse(String[] dateFormats, String dateString) {
        for (String format : dateFormats) {
            try {
                if (dateString != null && dateString.length() != 0) {
                    dateString = dateString.replaceAll("\"", "");
                    return new SimpleDateFormat(format).parse(dateString);
                }
            } catch (ParseException e) {
                // 무시하고 다음 형식 시도
                continue;
            }
        }
        // 어떤 형식에도 맞지 않으면 null 반환
        return null;
    }

    // 문자열이 날짜 형식인지 확인하는 메서드
    public static boolean isDate(String[] dateFormats, String dateString) {
        for (String format : dateFormats) {
            SimpleDateFormat dateFormat = new SimpleDateFormat(format);
            dateFormat.setLenient(false);
            try {
                dateFormat.parse(dateString);
                return true;
            } catch (ParseException e) {
                // 계속 진행
            }
        }
        return false;
    }

    public static Map<String, List<String>> listToMap(List<List<String>> dataList) {
        Map<String, List<String>> dataMap = new HashMap<>();
        for (List<String> data : dataList) {
            if (data.size() > 1) {
                dataMap.put(data.get(0), data);
            }
        }
        return dataMap;
    }

    public static Long extractAndConvertToLong(String dateString) {
        String numericOnly = dateString.replaceAll("[^\\d]", ""); // 숫자만 추출
        if (numericOnly.isEmpty()) {
            return 0L; // 또는 날짜가 유효하지 않을 경우 처리할 값 (예: null, 예외 처리 등)
        }
        return Long.parseLong(numericOnly);
    }
}
