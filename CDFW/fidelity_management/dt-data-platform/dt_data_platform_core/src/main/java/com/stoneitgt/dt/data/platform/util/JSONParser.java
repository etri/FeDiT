package com.stoneitgt.dt.data.platform.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.*;

@Slf4j
public class JSONParser {
    public static boolean isDuplicateDataByKey(List<Map<String, Object>> data, String findKey) throws Exception {
        if (data == null) {
            log.info("isDuplicateDataByKey -> {}", "File not found or empty");
            return false;
        }

        Set<String> seenKeys = new HashSet<>();
        ListIterator<Map<String, Object>> iterator = data.listIterator();

        boolean hasDuplicates = false;

        while (iterator.hasNext()) {
            Map<String, Object> map = iterator.next();
            String keyValue = map.get(findKey).toString();
            if (seenKeys.contains(keyValue)) {
                iterator.remove();
                hasDuplicates = true;
            } else {
                seenKeys.add(keyValue);
            }
        }
        return hasDuplicates;
    }

    public static List<Map<String, Object>> removeDuplicateDataByKey(List<Map<String, Object>> data, String findKey) throws Exception {
        if (data == null) {
            log.info("removeDuplicateDataByKey -> {}", "File not found or empty");
            return data;
        }

        Set<String> seenKeys = new HashSet<>();
        ListIterator<Map<String, Object>> iterator = data.listIterator();

        while (iterator.hasNext()) {
            Map<String, Object> map = iterator.next();
            String keyValue = map.get(findKey).toString();
            if (seenKeys.contains(keyValue)) {
                iterator.remove();
            } else {
                seenKeys.add(keyValue);
            }
        }
        return data;
    }

    public static String convertToJsonString(Map<String, Object> data) throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        return objectMapper.writeValueAsString(data);
    }

    /**
     * formatDigitalTwinObjectCreatedData
     *
     * @param isFull            전체 데이터를 넣을건지 아닌지 여부
     * @param DIGITAL_TWINS_ID  디지털 트윈 아이디
     * @param DIGITAL_OBJECT_ID 디지털 트윈의 오브젝트 아이디
     * @param AUGMENT_SEQ       증강 관련 아이디
     * @param augment_title     증강 모델 제목
     * @return null or JSONObject
     * 단건으로 데이터 업로드 할 수 있도록 파일을 읽어들여 JSONArray로 파싱
     * @author kimwoosik
     */
    public static JSONObject formatDigitalTwinObjectCreated(boolean isFull, String DIGITAL_TWINS_ID, String DIGITAL_OBJECT_ID, int AUGMENT_SEQ, String augment_title) {
        log.info("formatDigitalTwinCreatedData : " + isFull + ", DIGITAL_TWINS_ID : " + DIGITAL_TWINS_ID + ", DIGITAL_OBJECT_ID : " + DIGITAL_OBJECT_ID + ", AUGMENT_SEQ : " + AUGMENT_SEQ + ", augment_title : " + augment_title);
        JSONObject jsonObject = new JSONObject();
        if (!isFull) {
            jsonObject.put("digital_object_identifier", DIGITAL_OBJECT_ID + "_" + AUGMENT_SEQ);
            jsonObject.put("digital_object_name", augment_title);
        } else {
            //전체 데이터 전송 (API 개발 요청시)
            jsonObject.put("", "");
        }
        log.info("jsonObject -> {}", jsonObject);
        return jsonObject;
    }

    /**
     * formatIndividuallyData
     *
     * @param resultDataList 전체 데이터
     * @return null or JSONArray
     * 단건으로 데이터 업로드 할 수 있도록 파일을 읽어들여 JSONArray로 파싱
     */
    public static JSONArray formatIndividuallyData(List<Map<String, Object>> resultDataList) throws Exception {
        JSONArray dataJsonArray = new JSONArray();
        // 결과 리스트가 비어있는지 확인
        if (resultDataList != null && !resultDataList.isEmpty()) {
            // 리스트의 첫 번째 항목 가져오기
            Map<String, Object> resultData = resultDataList.get(0);

            // 항목 출력
            // 항목의 각 엔트리 순회
            for (Map.Entry<String, Object> entry : resultData.entrySet()) {
                String value = (String) entry.getValue();
                String filePath = value;
                List<Map<String, Object>> datas = FileReader.getInstance().readCSVToListObjectMap(filePath);
                // 데이터 리스트를 순회하며 각 변수들을 뽑아내기
                if (dataJsonArray.isEmpty() || dataJsonArray.length() == 0) {
                    for (Map<String, Object> data : datas) {
                        // entrySet을 이용하여 순회
                        JSONObject jsonObject = new JSONObject();
                        for (Map.Entry<String, Object> dataEntry : data.entrySet()) {
                            String dataKey = dataEntry.getKey();
                            Object dataValue = dataEntry.getValue();
                            jsonObject.put(dataKey, dataValue);
                        }
                        dataJsonArray.put(jsonObject);
                    }
                } else {
                    break;
                }
            }
            //log.info("formatIndividuallyData -> {}", dataJsonArray);
        } else {
            log.warn("resultDataList is either null or empty");
        }
        return dataJsonArray.isEmpty() || dataJsonArray.length() == 0 ? null : dataJsonArray;
    }

    public static JSONArray formatValidationData(List<Map<String, Object>> validationList, List<String> originTimeData) {
        //Validation 업로드 기본 정보
        JSONArray validationDataJsonArray = new JSONArray();
        for (Map<String, Object> map : validationList) {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("col", map.get("col").toString().replaceAll("\"", ""));
            jsonObject.put("valid_tp1", map.get("valid_tp1").toString().replaceAll("\"", ""));
            jsonObject.put("valid_tp2", map.get("valid_tp2").toString().replaceAll("\"", ""));
            try {
                List<Map<String, Object>> csvData = FileReader.getInstance().readCSVToListObjectMap(map.get("file_path").toString());
                JSONArray dataJsonArray = new JSONArray();
                if (csvData != null) { //Validation을 했지만 그대로 인것도 있음 그 부분은 건너 뛰기
                    //데이터 넣는 부분
                    for (Map<String, Object> data : csvData) {
                        // entrySet을 이용하여 순회
                        JSONObject dataJsonObject = new JSONObject();
                        for (Map.Entry<String, Object> dataEntry : data.entrySet()) {
                            String dataKey = dataEntry.getKey();
                            Object dataValue = dataEntry.getValue();
                            dataJsonObject.put(dataKey, dataValue);
                        }
                        dataJsonArray.put(dataJsonObject);
                    }
                }
                jsonObject.put("data", dataJsonArray);
                validationDataJsonArray.put(jsonObject);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        return validationDataJsonArray;
    }

    public static JSONArray formatOutlierData(List<Map<String, Object>> outlierList) {
        //Validation 업로드 기본 정보
        JSONArray outlierDataJsonArray = new JSONArray();
        for (Map<String, Object> map : outlierList) {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("col", map.get("col").toString().replaceAll("\"", ""));
            jsonObject.put("outlier_tp", map.get("outlier_tp").toString().replaceAll("\"", ""));
            try {
                List<Map<String, Object>> csvData = FileReader.getInstance().readCSVToListObjectMap(map.get("file_path").toString());
                JSONArray dataJsonArray = new JSONArray();
                if (csvData != null) { //Outlier를 했지만 그대로 인것도 있음 그 부분은 건너 뛰기
                    //데이터 넣는 부분
                    for (Map<String, Object> data : csvData) {
                        // entrySet을 이용하여 순회
                        JSONObject dataJsonObject = new JSONObject();
                        for (Map.Entry<String, Object> dataEntry : data.entrySet()) {
                            String dataKey = dataEntry.getKey();
                            Object dataValue = dataEntry.getValue();
                            dataJsonObject.put(dataKey, dataValue);
                        }
                        dataJsonArray.put(dataJsonObject);
                    }
                }
                jsonObject.put("data", dataJsonArray);
                outlierDataJsonArray.put(jsonObject);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        return outlierDataJsonArray;
    }

    // 값을 대체하는 재귀적 메서드입니다.
    public static JSONObject replaceValuesByKey(JSONObject jsonObject, Map<String, String> keyReplacementMap) {
        JSONObject result = new JSONObject();

        Iterator<String> keys = jsonObject.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            Object value = jsonObject.get(key);

            if (value instanceof JSONObject) {
                // 중첩된 JSONObject를 재귀적으로 처리합니다.
                value = replaceValuesByKey((JSONObject) value, keyReplacementMap);
            } else if (value instanceof JSONArray) {
                // JSONArray의 각 요소를 재귀적으로 처리합니다.
                value = replaceValuesByKey((JSONArray) value, keyReplacementMap);
            } else {
                // 현재 키가 keyReplacementMap에 있으면 값을 대체합니다.
                if (keyReplacementMap.containsKey(key)) {
                    value = keyReplacementMap.get(key);
                }
            }

            result.put(key, value);
        }
        return result;
    }

    // JSONArray의 요소를 재귀적으로 처리하는 메서드입니다.
    public static JSONArray replaceValuesByKey(JSONArray jsonArray, Map<String, String> keyReplacementMap) {
        JSONArray resultArray = new JSONArray();

        for (int i = 0; i < jsonArray.length(); i++) {
            Object element = jsonArray.get(i);
            if (element instanceof JSONObject) {
                resultArray.put(replaceValuesByKey((JSONObject) element, keyReplacementMap));
            } else if (element instanceof JSONArray) {
                resultArray.put(replaceValuesByKey((JSONArray) element, keyReplacementMap));
            } else {
                resultArray.put(element);
            }
        }
        return resultArray;
    }

    public static JSONArray recoveredDataFormat(JSONArray formattedIndividuallyDataArray, List<Map<String, Object>> csvData) {
        JSONArray jsonArray = new JSONArray();
        // 모든 데이터를 순회하며 jsonObject를 생성하고 jsonArray에 추가
        if (formattedIndividuallyDataArray.length() > csvData.size()) {
            for (int i = 0; i < formattedIndividuallyDataArray.length(); i++) {
                final int index = i;
                JSONObject jsonObject = new JSONObject();
                if ((csvData.size() - 1) < i) {
                    // csvData에서 값을 가져와 jsonObject에 추가
                    csvData.get((csvData.size() - 1)).keySet().forEach(key -> {
                        jsonObject.put(key, csvData.get((csvData.size() - 1)).get(key));
                    });
                    // 전처리된 데이터가 있는 경우 값을 추가
                    formattedIndividuallyDataArray.getJSONObject(i).keySet().forEach(key -> {
                        jsonObject.put(key, formattedIndividuallyDataArray.getJSONObject(index).get(key));
                    });
                } else {
                    // csvData에서 값을 가져와 jsonObject에 추가
                    csvData.get(i).keySet().forEach(key -> {
                        jsonObject.put(key, csvData.get(index).get(key));
                    });
                    // 전처리된 데이터가 있는 경우 값을 추가
                    formattedIndividuallyDataArray.getJSONObject(i).keySet().forEach(key -> {
                        jsonObject.put(key, formattedIndividuallyDataArray.getJSONObject(index).get(key));
                    });
                }

                // jsonArray에 jsonObject 추가
                jsonArray.put(jsonObject);
            }
        } else {
            for (int i = 0; i < formattedIndividuallyDataArray.length(); i++) {
                final int index = i;
                JSONObject jsonObject = new JSONObject();

                // csvData에서 값을 가져와 jsonObject에 추가
                csvData.get(i).keySet().forEach(key -> {
                    jsonObject.put(key, csvData.get(index).get(key));
                });

                // 전처리된 데이터가 있는 경우 값을 추가
                formattedIndividuallyDataArray.getJSONObject(i).keySet().forEach(key -> {
                    jsonObject.put(key, formattedIndividuallyDataArray.getJSONObject(index).get(key));
                });

                // jsonArray에 jsonObject 추가
                jsonArray.put(jsonObject);
            }
        }
        return jsonArray;
    }

    public static JSONArray recoveredDecisionTreeLabel(ArrayList<String> labels, String decisionKey, JSONArray jsonArray) {
        log.info("decisionKey -> {}, labels -> {}", decisionKey, labels);

        if (decisionKey != null && !labels.isEmpty()) {
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject jsonObject = jsonArray.getJSONObject(i);
                if (jsonObject.has(decisionKey)) {
                    String value = jsonObject.get(decisionKey).toString();
                    int labelIndex = (int) Double.parseDouble(value);
                    jsonObject.put(decisionKey, labels.get(labelIndex));
                }
            }
        }
        return jsonArray;
    }

    public static List<Map<String, Object>> convertJsonArrayToListOfMaps(JSONArray jsonArray) {
        List<Map<String, Object>> listOfMaps = new ArrayList<>();

        for (int i = 0; i < jsonArray.length(); i++) {
            JSONObject jsonObject = jsonArray.getJSONObject(i);
            Map<String, Object> map = new HashMap<>();

            for (String key : jsonObject.keySet()) {
                map.put(key, jsonObject.getString(key));
            }

            listOfMaps.add(map);
        }

        return listOfMaps;
    }

    public static JSONObject convertMapToJson(Map<String, Object> map) {
        JSONObject json = new JSONObject();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            String key = entry.getKey().replace("\"", "");
            Object value = entry.getValue().toString().replace("\"", "");
            json.put(key, value);
        }
        return json;
    }

    public static JSONArray convertListMapToJson(List<Map<String, Object>> listMap) {
        JSONArray jsonArray = new JSONArray();
        for (Map<String, Object> map : listMap) {
            jsonArray.put(convertMapToJson(map));
        }
        return jsonArray;
    }
}