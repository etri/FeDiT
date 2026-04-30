package test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class ObjectMapperEx {
    public static void main(String[] args) {
        // JSON 문자열 예제
        String jsonString = "{\"otherField\": \"value\"}";

        // ObjectMapper를 사용하여 JSON 문자열을 JsonNode로 파싱
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode jsonNode = null;

        try {
            jsonNode = objectMapper.readTree(jsonString);
        } catch (IOException e) {
            e.printStackTrace();
        }

        // http_data_obj를 초기화
        Map<String, String> http_data_obj = new HashMap<>();

        // JSONPath를 사용하여 "location" 필드의 값을 읽어온다
        try {
            Object locationValue = JsonPath.read(jsonNode.toString(), "$.location");

            // 값이 존재하는 경우, 해당 값을 문자열로 변환하여 http_data_obj에 추가
            http_data_obj.put("location", locationValue.toString());
        } catch (Exception e) {
            // JSONPath에서 "location" 필드를 찾을 수 없는 경우
            // 또는 값이 null인 경우에 대한 예외 처리
            http_data_obj.put("location", "POINT EMPTY");
        }

        // 결과 출력
        System.out.println("http_data_obj: " + http_data_obj);
    }
}
