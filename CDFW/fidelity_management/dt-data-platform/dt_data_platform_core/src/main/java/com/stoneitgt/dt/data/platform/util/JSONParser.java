package com.stoneitgt.dt.data.platform.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Slf4j
public class JSONParser {

    // JSON 트리 생성용 — ObjectMapper 는 스레드 세이프하므로 정적 인스턴스를 재사용한다
    private static final ObjectMapper MAPPER = new ObjectMapper();
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

    /**
     * formatIndividuallyData
     *
     * @param resultDataList 전체 데이터
     * @return null or ArrayNode
     * 단건으로 데이터 업로드 할 수 있도록 파일을 읽어들여 ArrayNode로 파싱
     */
    public static ArrayNode formatIndividuallyData(List<Map<String, Object>> resultDataList) throws Exception {
        ArrayNode dataJsonArray = MAPPER.createArrayNode();
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
                if (dataJsonArray.size() == 0) {
                    for (Map<String, Object> data : datas) {
                        // CSV 한 행(Map)을 그대로 JSON 객체로 변환
                        JsonNode jsonObject = MAPPER.valueToTree(data);
                        dataJsonArray.add(jsonObject);
                    }
                } else {
                    break;
                }
            }
            //log.info("formatIndividuallyData -> {}", dataJsonArray);
        } else {
            log.warn("resultDataList is either null or empty");
        }
        return dataJsonArray.size() == 0 ? null : dataJsonArray;
    }

    public static ArrayNode formatValidationData(List<Map<String, Object>> validationList, List<String> originTimeData) {
        //Validation 업로드 기본 정보
        ArrayNode validationDataJsonArray = MAPPER.createArrayNode();
        for (Map<String, Object> map : validationList) {
            ObjectNode jsonObject = MAPPER.createObjectNode();
            jsonObject.put("col", map.get("col").toString().replaceAll("\"", ""));
            jsonObject.put("valid_tp1", map.get("valid_tp1").toString().replaceAll("\"", ""));
            jsonObject.put("valid_tp2", map.get("valid_tp2").toString().replaceAll("\"", ""));
            try {
                List<Map<String, Object>> csvData = FileReader.getInstance().readCSVToListObjectMap(map.get("file_path").toString());
                ArrayNode dataJsonArray = MAPPER.createArrayNode();
                if (csvData != null) { //Validation을 했지만 그대로 인것도 있음 그 부분은 건너 뛰기
                    //데이터 넣는 부분
                    for (Map<String, Object> data : csvData) {
                        // CSV 한 행(Map)을 그대로 JSON 객체로 변환
                        JsonNode dataJsonObject = MAPPER.valueToTree(data);
                        dataJsonArray.add(dataJsonObject);
                    }
                }
                jsonObject.set("data", dataJsonArray);
                validationDataJsonArray.add(jsonObject);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        return validationDataJsonArray;
    }

    public static ArrayNode formatOutlierData(List<Map<String, Object>> outlierList) {
        //Validation 업로드 기본 정보
        ArrayNode outlierDataJsonArray = MAPPER.createArrayNode();
        for (Map<String, Object> map : outlierList) {
            ObjectNode jsonObject = MAPPER.createObjectNode();
            jsonObject.put("col", map.get("col").toString().replaceAll("\"", ""));
            jsonObject.put("outlier_tp", map.get("outlier_tp").toString().replaceAll("\"", ""));
            try {
                List<Map<String, Object>> csvData = FileReader.getInstance().readCSVToListObjectMap(map.get("file_path").toString());
                ArrayNode dataJsonArray = MAPPER.createArrayNode();
                if (csvData != null) { //Outlier를 했지만 그대로 인것도 있음 그 부분은 건너 뛰기
                    //데이터 넣는 부분
                    for (Map<String, Object> data : csvData) {
                        // CSV 한 행(Map)을 그대로 JSON 객체로 변환
                        JsonNode dataJsonObject = MAPPER.valueToTree(data);
                        dataJsonArray.add(dataJsonObject);
                    }
                }
                jsonObject.set("data", dataJsonArray);
                outlierDataJsonArray.add(jsonObject);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        return outlierDataJsonArray;
    }

    // 값을 대체하는 재귀적 메서드입니다.
    public static ObjectNode replaceValuesByKey(ObjectNode jsonObject, Map<String, String> keyReplacementMap) {
        ObjectNode result = MAPPER.createObjectNode();

        Iterator<String> keys = jsonObject.fieldNames();
        while (keys.hasNext()) {
            String key = keys.next();
            JsonNode value = jsonObject.get(key);

            if (value instanceof ObjectNode) {
                // 중첩된 객체를 재귀적으로 처리합니다.
                result.set(key, replaceValuesByKey((ObjectNode) value, keyReplacementMap));
            } else if (value instanceof ArrayNode) {
                // 배열의 각 요소를 재귀적으로 처리합니다.
                result.set(key, replaceValuesByKey((ArrayNode) value, keyReplacementMap));
            } else if (keyReplacementMap.containsKey(key)) {
                // 현재 키가 keyReplacementMap에 있으면 값을 대체합니다.
                result.put(key, keyReplacementMap.get(key));
            } else {
                result.set(key, value);
            }
        }
        return result;
    }

    // 배열의 요소를 재귀적으로 처리하는 메서드입니다.
    public static ArrayNode replaceValuesByKey(ArrayNode jsonArray, Map<String, String> keyReplacementMap) {
        ArrayNode resultArray = MAPPER.createArrayNode();

        for (int i = 0; i < jsonArray.size(); i++) {
            JsonNode element = jsonArray.get(i);
            if (element instanceof ObjectNode) {
                resultArray.add(replaceValuesByKey((ObjectNode) element, keyReplacementMap));
            } else if (element instanceof ArrayNode) {
                resultArray.add(replaceValuesByKey((ArrayNode) element, keyReplacementMap));
            } else {
                resultArray.add(element);
            }
        }
        return resultArray;
    }

    public static ArrayNode recoveredDataFormat(ArrayNode formattedIndividuallyDataArray, List<Map<String, Object>> csvData) {
        ArrayNode jsonArray = MAPPER.createArrayNode();
        // 모든 데이터를 순회하며 jsonObject를 생성하고 jsonArray에 추가
        if (formattedIndividuallyDataArray.size() > csvData.size()) {
            for (int i = 0; i < formattedIndividuallyDataArray.size(); i++) {
                final int index = i;
                ObjectNode jsonObject = MAPPER.createObjectNode();
                ObjectNode formatted = (ObjectNode) formattedIndividuallyDataArray.get(index);
                if ((csvData.size() - 1) < i) {
                    // csvData에서 값을 가져와 jsonObject에 추가
                    csvData.get((csvData.size() - 1)).keySet().forEach(key -> {
                        jsonObject.set(key, MAPPER.valueToTree(csvData.get((csvData.size() - 1)).get(key)));
                    });
                    // 전처리된 데이터가 있는 경우 값을 추가
                    formatted.fieldNames().forEachRemaining(key -> {
                        jsonObject.set(key, formatted.get(key));
                    });
                } else {
                    // csvData에서 값을 가져와 jsonObject에 추가
                    csvData.get(i).keySet().forEach(key -> {
                        jsonObject.set(key, MAPPER.valueToTree(csvData.get(index).get(key)));
                    });
                    // 전처리된 데이터가 있는 경우 값을 추가
                    formatted.fieldNames().forEachRemaining(key -> {
                        jsonObject.set(key, formatted.get(key));
                    });
                }

                // jsonArray에 jsonObject 추가
                jsonArray.add(jsonObject);
            }
        } else {
            for (int i = 0; i < formattedIndividuallyDataArray.size(); i++) {
                final int index = i;
                ObjectNode jsonObject = MAPPER.createObjectNode();
                ObjectNode formatted = (ObjectNode) formattedIndividuallyDataArray.get(index);

                // csvData에서 값을 가져와 jsonObject에 추가
                csvData.get(i).keySet().forEach(key -> {
                    jsonObject.set(key, MAPPER.valueToTree(csvData.get(index).get(key)));
                });

                // 전처리된 데이터가 있는 경우 값을 추가
                formatted.fieldNames().forEachRemaining(key -> {
                    jsonObject.set(key, formatted.get(key));
                });

                // jsonArray에 jsonObject 추가
                jsonArray.add(jsonObject);
            }
        }
        return jsonArray;
    }

    public static ArrayNode recoveredDecisionTreeLabel(ArrayList<String> labels, String decisionKey, ArrayNode jsonArray) {
        log.info("decisionKey -> {}, labels -> {}", decisionKey, labels);

        if (decisionKey != null && !labels.isEmpty()) {
            for (int i = 0; i < jsonArray.size(); i++) {
                ObjectNode jsonObject = (ObjectNode) jsonArray.get(i);
                if (jsonObject.has(decisionKey)) {
                    // asText() 사용 필수 — JsonNode.toString() 은 문자열 값에 따옴표를 포함해 parseDouble 이 실패한다
                    String value = jsonObject.get(decisionKey).asText();
                    int labelIndex = (int) Double.parseDouble(value);
                    jsonObject.put(decisionKey, labels.get(labelIndex));
                }
            }
        }
        return jsonArray;
    }

    public static List<Map<String, Object>> convertJsonArrayToListOfMaps(ArrayNode jsonArray) {
        List<Map<String, Object>> listOfMaps = new ArrayList<>();

        for (int i = 0; i < jsonArray.size(); i++) {
            ObjectNode jsonObject = (ObjectNode) jsonArray.get(i);
            Map<String, Object> map = new HashMap<>();

            Iterator<String> keys = jsonObject.fieldNames();
            while (keys.hasNext()) {
                String key = keys.next();
                map.put(key, jsonObject.get(key).asText());
            }

            listOfMaps.add(map);
        }

        return listOfMaps;
    }

    public static ObjectNode convertMapToJson(Map<String, Object> map) {
        ObjectNode json = MAPPER.createObjectNode();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            String key = entry.getKey().replace("\"", "");
            String value = entry.getValue().toString().replace("\"", "");
            json.put(key, value);
        }
        return json;
    }

    public static ArrayNode convertListMapToJson(List<Map<String, Object>> listMap) {
        ArrayNode jsonArray = MAPPER.createArrayNode();
        for (Map<String, Object> map : listMap) {
            jsonArray.add(convertMapToJson(map));
        }
        return jsonArray;
    }

    /*public static List<Map<String, Object>> parseDigitalTwinObjectData(List<Map<String, Object>> digitalTwinObjectData, String dataPath, String timePath) {
        log.info("parseDigitalTwinObjectData -> dataPath: {}, timePath: {}", dataPath, timePath);
        if (digitalTwinObjectData == null || digitalTwinObjectData.isEmpty()) {
            return Collections.emptyList();
        }

        ObjectMapper objectMapper = new ObjectMapper();
        List<Map<String, Object>> parsedDataList = new ArrayList<>();
        Set<String> templateKeys = new HashSet<>();

        // 경로 분리 로직
        String[] depthKeys = dataPath != null ? dataPath.replaceAll("\\[(\\d+)]", ".$1").split("\\.") : new String[0];
        String[] timeKeys = timePath != null ? timePath.replaceAll("\\[(\\d+)]", ".$1").split("\\.") : new String[0];

        int count = 0;

        for (Map<String, Object> dataMap : digitalTwinObjectData) {
            JsonNode rootNode = objectMapper.valueToTree(dataMap);

            // 1. 시간 값 추출 (rootNode부터 탐색)
            JsonNode timeNode = rootNode;
            for (String tKey : timeKeys) {
                if (tKey.isEmpty()) continue;
                timeNode = tKey.matches("\\d+") ? timeNode.path(Integer.parseInt(tKey)) : timeNode.path(tKey);
            }
            String commonTime = (timeNode.isMissingNode() || timeNode.isNull()) ? rootNode.path("rowtime").asText() : timeNode.asText();

            // 2. 대상 데이터 추출 (rootNode부터 탐색)
            JsonNode targetNode = rootNode;
            for (String dKey : depthKeys) {
                if (dKey.isEmpty()) continue;
                targetNode = dKey.matches("\\d+") ? targetNode.path(Integer.parseInt(dKey)) : targetNode.path(dKey);
            }

            // 3. 가변 구조 처리 (핵심 로직)
            if (!targetNode.isMissingNode() && !targetNode.isNull()) {

                // 케이스 1: 찾은 노드가 이미 배열인 경우 (타입 B의 data.data 부분)
                if (targetNode.isArray()) {
                    for (JsonNode item : targetNode) {
                        processAndAdd(parsedDataList, item, commonTime, objectMapper, templateKeys);
                    }
                }
                // 케이스 2: 찾은 노드가 객체인 경우
                else if (targetNode.isObject()) {
                    // 타입 B 대응: 객체 안에 또 "data"라는 배열이 있는지 확인
                    if (targetNode.has("data") && targetNode.get("data").isArray()) {
                        for (JsonNode item : targetNode.get("data")) {
                            processAndAdd(parsedDataList, item, commonTime, objectMapper, templateKeys);
                        }
                    } else {
                        // 타입 A 대응: 객체 자체가 데이터인 경우
                        processAndAdd(parsedDataList, targetNode, commonTime, objectMapper, templateKeys);
                    }
                }
            }
        }
        return parsedDataList;
    }

    private static void processAndAdd(List<Map<String, Object>> list, JsonNode node, String timeValue, ObjectMapper mapper, Set<String> templateKeys) {
        // 1. JSON 노드를 Map으로 변환
        Map<String, Object> map = mapper.convertValue(node, new TypeReference<Map<String, Object>>() {
        });

        if (templateKeys.isEmpty()) {
            // [초기화 단계] 첫 번째 데이터에서 기준이 될 'Clean Keys'를 추출합니다.

            // A. 키 이름에 time, date가 포함된 것 제거
            // map.keySet().removeIf(key -> key.toLowerCase().contains("time") || key.toLowerCase().contains("date"));

            // B. 값 자체가 날짜 형식인 것 제거
            *//*map.entrySet().removeIf(entry -> {
                Object value = entry.getValue();
                return value instanceof String && ConvertUtil.isDate(ConvertUtil.DATEFORMATS, (String) value);
            });*//*

            // C. 정제된 키들만 templateKeys에 저장
            templateKeys.addAll(map.keySet());
        } else {
            // [유지 단계] 두 번째 데이터부터는 첫 번째 데이터에서 정해진 키만 남깁니다.
            // 이 과정에서 첫 번째 데이터에 없던 새로운 시간/날짜 키가 들어와도 자동으로 제거됩니다.
            map.keySet().retainAll(templateKeys);
        }

        // 2. 공통 시간 값(rowtime)은 어떤 경우에도 추가
        map.put("rowtime", TimeUtil.formatZonedDateTimeStringToDateTimeFormat(timeValue));
        list.add(map);
    }*/

    public static List<Map<String, Object>> parseDigitalTwinObjectData(List<Map<String, Object>> digitalTwinObjectData, String dataPath, String timePath) {
        log.info("parseDigitalTwinObjectData -> dataPath: {}, timePath: {}", dataPath, timePath);

        if (digitalTwinObjectData == null || digitalTwinObjectData.isEmpty()) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> parsedDataList = new ArrayList<>();

        for (Map<String, Object> rawMap : digitalTwinObjectData) {
            Map<String, Object> parsedMap = new HashMap<>();

            // 1. 시간 데이터 처리 (timePath 추출 및 포매팅)
            // timePath가 depth가 있을 경우(a.b.rowtime)를 대비해 재귀적으로 가져오거나 직접 추출
            Object timeValue = getValueByPath(rawMap, timePath);
            if (timeValue != null) {
                // 요구하신 대로 TimeUtil을 사용하여 포매팅 후 저장
                String formattedTime = TimeUtil.formatZonedDateTimeStringToDateTimeFormat(timeValue.toString());
                parsedMap.put("rowtime", formattedTime);
            }

            // 2. 실제 데이터 처리 (dataPath 기준)
            // 관측 데이터가 들어있는 'data' 맵 추출
            Object rawData = rawMap.get("data");
            Map<String, Object> dataContainer = null;

            if (rawData instanceof Map) {
                Map<String, Object> tempMap = (Map<String, Object>) rawData;

                // 핵심 로직: data 안에 또 data(배열)가 있는지 확인
                if (tempMap.containsKey("data") && tempMap.get("data") instanceof List) {
                    List<Map<String, Object>> dataList = (List<Map<String, Object>>) tempMap.get("data");
                    if (!dataList.isEmpty()) {
                        // 룰에 따라 0번 인덱스 선정
                        dataContainer = dataList.get(0);
                    }
                } else {
                    // data 내부에 배열이 없으면 tempMap 자체가 컨테이너
                    dataContainer = tempMap;
                }
            }

            // 3. 정규화된 컨테이너에서 값 추출
            if (dataContainer != null) {
                for (String key : dataContainer.keySet()) {
                    Object valObj = dataContainer.get(key);

                    if ("data.{key}.value".equals(dataPath)) {
                        if (valObj instanceof Map) {
                            Map<String, Object> propertyMap = (Map<String, Object>) valObj;
                            if (propertyMap.containsKey("value") && propertyMap.containsKey("type") && propertyMap.get("type").equals("Property")) {
                                Object value = propertyMap.get("value");
                                if (value != null) {
                                    // 2. 숫자 형식인지 확인 (Integer, Long, Double, Float 등)
                                    if (value instanceof Number) {
                                        parsedMap.put(key, value);
                                    }
                                    // 3. 날짜 형식 문자열인지 확인 (예: 2026-04-13T00:40:00Z)
                                    else if (value instanceof String && ConvertUtil.isDate(ConvertUtil.DATEFORMATS, (String) value)) {
                                        parsedMap.put(key, value);
                                    }
                                }
                            }
                        }
                    } else if ("data.{key}".equals(dataPath)) {
                        // key가 "data"인 경우는 위에서 이미 처리했으므로 스킵하거나
                        // 필요 시 포함 (일반적으로 co, o3 등만 추출)
                        if (!"data".equals(key)) {
                            parsedMap.put(key, valObj);
                        }
                    }
                }
            }
            parsedDataList.add(parsedMap);
        }

        return parsedDataList;
    }

    /**
     * 점(.)으로 구분된 경로를 통해 Map에서 값을 추출하는 유틸리티 메서드
     * 예: rowtime 또는 platform.rowtime 등 대응 가능
     */
    private static Object getValueByPath(Map<String, Object> map, String path) {
        if (path == null || !path.contains(".")) {
            return map.get(path);
        }

        String[] parts = path.split("\\.");
        Object current = map;
        for (String part : parts) {
            if (current instanceof Map) {
                current = ((Map<?, ?>) current).get(part);
            } else {
                return null;
            }
        }
        return current;
    }

    public static List<ObjectNode> splitValidationData(ObjectNode jsonObject, int chunkSize) {
        List<ObjectNode> chunkedList = new ArrayList<>();

        ArrayNode validationArray = (ArrayNode) jsonObject.get("validation");
        if (validationArray.size() == 0) {
            return chunkedList;
        }
        ObjectNode validationObj = (ObjectNode) validationArray.get(0);
        ArrayNode dataArray = (ArrayNode) validationObj.get("data");

        for (int i = 0; i < dataArray.size(); i += chunkSize) {
            int end = Math.min(i + chunkSize, dataArray.size());
            ArrayNode chunkData = MAPPER.createArrayNode();

            for (int j = i; j < end; j++) {
                chunkData.add(dataArray.get(j));
            }

            // 전체 원본 JSON 깊은 복사
            ObjectNode newJson = jsonObject.deepCopy();

            // validation[0].data만 바꾸기
            ((ObjectNode) ((ArrayNode) newJson.get("validation")).get(0)).set("data", chunkData);

            // optional: 전송 chunk 정보 삽입
            newJson.put("chunk_index", (i / chunkSize) + 1);
            newJson.put("chunk_total", (int) Math.ceil(dataArray.size() / (double) chunkSize));

            chunkedList.add(newJson);
        }

        return chunkedList;
    }

    // data 배열을 쪼개서 여러 JSON 객체로 분할
    public static List<ObjectNode> splitOutlierData(ObjectNode jsonObject, int chunkSize) {
        List<ObjectNode> chunkedList = new ArrayList<>();

        ArrayNode outlierArray = (ArrayNode) jsonObject.get("outlier");
        if (outlierArray.size() == 0) {
            return chunkedList;
        }
        ObjectNode outlierObj = (ObjectNode) outlierArray.get(0);
        ArrayNode dataArray = (ArrayNode) outlierObj.get("data");

        for (int i = 0; i < dataArray.size(); i += chunkSize) {
            int end = Math.min(i + chunkSize, dataArray.size());
            ArrayNode chunkData = MAPPER.createArrayNode();

            for (int j = i; j < end; j++) {
                chunkData.add(dataArray.get(j));
            }

            // 전체 원본 JSON 복사
            ObjectNode newJson = jsonObject.deepCopy();

            // outlier[0].data 만 교체
            ((ObjectNode) ((ArrayNode) newJson.get("outlier")).get(0)).set("data", chunkData);

            // 필요시 추가 정보 넣기 (선택 사항)
            newJson.put("chunk_index", (i / chunkSize) + 1);
            newJson.put("chunk_total", (int) Math.ceil(dataArray.size() / (double) chunkSize));
            chunkedList.add(newJson);
        }
        return chunkedList;
    }
}