package com.stoneitgt.dt.data.platform.util;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.protocol.ProtocolBuilder;
import com.stoneitgt.dt.data.platform.util.protocol.ProtocolBuilderHelper;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVReader;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class JSONParser {

    private String json;

    public JSONParser(String json) {
        this.json = json;
    }

    public String getFirstNodeProcInfo(String key) {
        JSONObject jsonObject = new JSONObject(json);
        JSONArray preprocPropertyInfo = jsonObject.getJSONArray("preproc_property_info");
        JSONObject firstElement = preprocPropertyInfo.getJSONObject(0); // Assuming only one element in preproc_property_info

        return firstElement.optString(key, null);
    }

    public String[] getPreprocTrgtCol(String key) {
        JSONObject jsonObject = new JSONObject(json);
        JSONArray preprocPropertyInfo = jsonObject.getJSONArray("preproc_property_info");
        JSONObject firstElement = preprocPropertyInfo.getJSONObject(0); // Assuming only one element in preproc_property_info
        JSONArray preprocTrgtColArray = firstElement.getJSONArray("preproc_trgt_col");

        String[] preprocTrgtCol = new String[preprocTrgtColArray.length()];
        for (int i = 0; i < preprocTrgtColArray.length(); i++) {
            preprocTrgtCol[i] = preprocTrgtColArray.getString(i);
        }
        return preprocTrgtCol;
    }

    public JSONArray getPreprocProperty(String key) {
        JSONObject jsonObject = new JSONObject(json);
        JSONArray preprocPropertyInfo = jsonObject.getJSONArray("preproc_property_info");
        JSONObject firstElement = preprocPropertyInfo.getJSONObject(0); // Assuming only one element in preproc_property_info

        return firstElement.getJSONArray(key);
    }

    public static void sendValidationData(BaseSystemProperties properties, JSONObject jsonObject) {
        log.info("sendValidationData");
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String url = properties.getDtKetiApiUrl() + "/fedit/v1/validations";
        log.info("url -> {}", url);
        HttpEntity<String> request = new HttpEntity<>(jsonObject.toString(), headers);
        //String response = restTemplate.postForObject(url, request, String.class);
        //log.info("sendValidationData -> {}", response);
    }

    public static void sendOutlierData(BaseSystemProperties properties, JSONObject jsonObject) {
        log.info("sendOutlierData");
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String url = properties.getDtKetiApiUrl() + "/fedit/v1/outliers";
        log.info("url -> {}", url);
        HttpEntity<String> request = new HttpEntity<>(jsonObject.toString(), headers);
        //String response = restTemplate.postForObject(url, request, String.class);
        //log.info("sendOutlierData -> {}", response);
    }

    public static void sendErrorToJson(BaseSystemProperties properties, Map<String, Object> errorInfo) throws Exception {
        log.info("sendErrorToJson");
        Map<String, Object> result = new HashMap<>();
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String url = properties.getDtKetiApiUrl() + "/fedit/v1/errors";
        log.info("url -> {}", url);
        HttpEntity<String> request = new HttpEntity<>(convertToJson(errorInfo).toString(), headers);
        //String response = restTemplate.postForObject(url, request, String.class);
        //log.info("sendErrorToJson -> {}", response);
    }

    public static boolean isDuplicateDataByKey(String filePath, String findKey) throws Exception {
        List<Map<String, String>> csvData = readCsv(filePath);
        if (csvData == null) {
            System.out.println("File not found or empty");
            return false;
        }

        Set<String> seenKeys = new HashSet<>();
        ListIterator<Map<String, String>> iterator = csvData.listIterator();

        boolean hasDuplicates = false;

        while (iterator.hasNext()) {
            Map<String, String> map = iterator.next();
            String keyValue = map.get(findKey);
            if (seenKeys.contains(keyValue)) {
                iterator.remove();
                hasDuplicates = true;
            } else {
                seenKeys.add(keyValue);
            }
        }
        if (hasDuplicates) {
            writeCsv(filePath, csvData);
        }
        return hasDuplicates;
    }

    public static List<Map<String, Object>> isDuplicateDataByKey(List<Map<String, Object>> data, String findKey) throws Exception {
        List<Map<String, Object>> csvData = data;
        log.info("origin data size -> {}, {}", data.size(), findKey);
        if (csvData == null) {
            System.out.println("File not found or empty");
            return data;
        }

        Set<String> seenKeys = new HashSet<>();
        ListIterator<Map<String, Object>> iterator = csvData.listIterator();

        while (iterator.hasNext()) {
            Map<String, Object> map = iterator.next();
            String keyValue = map.get(findKey).toString();
            if (seenKeys.contains(keyValue)) {
                iterator.remove();
            } else {
                seenKeys.add(keyValue);
            }
        }
        log.info("removed data size -> {}", data.size());
        return data;
    }

    public static void writeObjectCsv(String filePath, List<Map<String, Object>> csvData) throws IOException {
        try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(Files.newOutputStream(Paths.get(filePath)), StandardCharsets.UTF_8))) {
            if (csvData.isEmpty()) {
                return;
            }

            // 헤더 쓰기
            Set<String> headers = csvData.get(0).keySet();
            String headerLine = headers.stream().map(header -> "\"" + header + "\"").collect(Collectors.joining(","));
            bw.write(headerLine);
            bw.newLine();

            // 데이터 쓰기
            for (Map<String, Object> map : csvData) {
                String line = headers.stream().map(header -> {
                    Object value = map.get(header);
                    String valueStr = value != null ? value.toString() : "";
                    return "\"" + valueStr + "\"";
                }).collect(Collectors.joining(","));
                bw.write(line);
                bw.newLine();
            }
        }
    }

    public static void writeCsv(String filePath, List<Map<String, String>> csvData) throws IOException {
        try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(Files.newOutputStream(Paths.get(filePath)), StandardCharsets.UTF_8))) {
            if (csvData.isEmpty()) {
                return;
            }

            // 헤더 쓰기
            Set<String> headers = csvData.get(0).keySet();
            String headerLine = headers.stream().map(header -> {
                // 헤더가 이미 쌍따옴표로 감싸져 있는지 확인
                if (header.contains("\"")) {
                    return header;
                } else {
                    return "\"" + header + "\"";
                }
            }).collect(Collectors.joining(","));
            bw.write(headerLine);
            bw.newLine();

            // 데이터 쓰기
            for (Map<String, String> map : csvData) {
                String line = headers.stream().map(header -> {
                    String value = map.get(header);
                    // 값이 이미 쌍따옴표로 감싸져 있는지 확인
                    if (value.contains("\"")) {
                        return value;
                    } else {
                        return "\"" + value + "\"";
                    }
                }).collect(Collectors.joining(","));
                bw.write(line);
                bw.newLine();
            }
        }
    }

    public static void writeCsv(String filePath, ArrayList<String> tempHeaders, List<List<String>> tempDatas) throws IOException {
        try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(Files.newOutputStream(Paths.get(filePath)), StandardCharsets.UTF_8))) {
            if (tempDatas.isEmpty() || tempHeaders.isEmpty()) {
                return;
            }

            // 헤더 쓰기
            String headerLine = tempHeaders.stream().map(header -> {
                // 헤더가 이미 쌍따옴표로 감싸져 있는지 확인
                if (header.contains("\"")) {
                    return header;
                } else {
                    return "\"" + header + "\"";
                }
            }).collect(Collectors.joining(","));
            bw.write(headerLine);
            bw.newLine();

            // 데이터 쓰기
            for (List<String> datas : tempDatas) {
                String line = datas.stream().map(data -> {
                    String value = data;
                    // 값이 이미 쌍따옴표로 감싸져 있는지 확인
                    if (value.contains("\"")) {
                        return value;
                    } else {
                        return "\"" + value + "\"";
                    }
                }).collect(Collectors.joining(","));
                bw.write(line);
                bw.newLine();
            }
        }
    }

    public static List<Map<String, Object>> readObjectCsv(String filePath) throws Exception {
        List<Map<String, Object>> csvData = new ArrayList<>();

        java.io.File file = new java.io.File(filePath);
        if (!file.exists()) {
            return null; // Return null if file does not exist
        }

        try (CSVReader csvReader = new CSVReader(new FileReader(filePath))) {
            String[] headers = csvReader.readNext();
            String[] values;

            while ((values = csvReader.readNext()) != null) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    row.put(headers[i], values[i]);
                }
                csvData.add(row);
            }
        }
        return csvData;
    }

    public static List<Map<String, String>> readCsv(String filePath) throws Exception {
        List<Map<String, String>> csvData = new ArrayList<>();

        java.io.File file = new java.io.File(filePath);
        if (!file.exists()) {
            return null; // Return null if file does not exist
        }

        try (CSVReader csvReader = new CSVReader(new FileReader(filePath))) {
            String[] headers = csvReader.readNext();
            String[] values;

            while ((values = csvReader.readNext()) != null) {
                Map<String, String> row = new HashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    row.put(headers[i], values[i]);
                }
                csvData.add(row);
            }
        }
        return csvData;
    }

    public static Map<String, Object> readCSVLastRowData(String filePath, String fileName) throws IOException {
        String csvFile = filePath + "/" + fileName; // 전체 파일 경로 생성

        log.info("csvFile:::" + csvFile);

        List<String> headerList = new ArrayList<>(); // 헤더를 담을 리스트
        List<Map<String, Object>> dataList = new ArrayList<>(); // 데이터를 담을 리스트

        try (FileReader fileReader = new FileReader(csvFile); BufferedReader br = new BufferedReader(fileReader)) {
            String line;
            boolean isFirstLine = true;
            while ((line = br.readLine()) != null) {
                String[] values = line.split(","); // CSV 파일을 쉼표로 분리하여 배열에 저장
                if (isFirstLine) {
                    for (String value : values) {
                        headerList.add(value.replaceAll("\"", "")); // 첫 번째 행은 헤더로 저장
                    }
                    isFirstLine = false;
                } else {
                    Map<String, Object> rowData = new HashMap<>();
                    for (int i = 0; i < values.length; i++) {
                        rowData.put(headerList.get(i), values[i].replaceAll("\"", "")); // 나머지 행은 데이터로 저장
                    }
                    dataList.add(rowData);
                }
            }
        }
        Map<String, Object> lastRowData = new HashMap<>();
        if (!dataList.isEmpty()) {
            lastRowData = dataList.get(dataList.size() - 1);
        }
        return lastRowData;
    }

    public static String convertToJson(Map<String, Object> data) throws Exception {
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
     * sendDigitalTwinObjectCreatedData
     *
     * @param DIGITAL_TWINS_ID 디지털 트윈 아이디
     * @param createdJSONData  디지털 트윈 객체 생성 데이터
     *                         {"digital_object_identifier":"KR-light", "digital_object_name":"test"}
     * @apiNote http://{IP}:{PORT}/fedit/light/digital-twins/{DIGITAL_TWINS_ID}/digital-objects
     * @author kimwoosik
     */
    public static void sendDigitalTwinObjectCreated(BaseSystemProperties properties, String DIGITAL_TWINS_ID, JSONObject createdJSONData) {
        log.info("sendDigitalTwinCreatedData : " + ", DIGITAL_TWINS_ID : " + DIGITAL_TWINS_ID + ", createdJSONData : " + createdJSONData);
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        //KETI DigitalObjects Created Data Upload Url
        String url = properties.getDtKetiApiUrl() + "/fedit/light/digital-twins/" + DIGITAL_TWINS_ID + "/digital-objects";
        HttpEntity<String> request = new HttpEntity<>(createdJSONData.toString(), headers);
        //ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
        //log.info("sendDigitalTwinObjectCreatedData response : " + response.getBody());
    }

    /**
     * sendDigitalTwinObjectDeleteData
     *
     * @param
     * @apiNote http://{IP}:{PORT}/fedit/light/digital-twins/{DIGITAL_TWINS_ID}/digital-objects/{DIGITAL_TWINS_OBJECT_ID + _AUGMENT_SEQ}
     */

    public static void sendDigitalTwinObjectDelete(BaseSystemProperties properties, String DIGITAL_TWINS_ID, String DIGITAL_OBJECT_ID, int augment_seq) {
        log.info("sendDigitalTwinObjectDelete : " + ", DIGITAL_TWINS_ID : " + DIGITAL_TWINS_ID + ", DIGITAL_OBJECT_ID : " + DIGITAL_OBJECT_ID + ", augment_seq : " + augment_seq);
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        //headers.setBearerAuth("AUTH_KEY");

        //KETI DigitalObjects Delete Url
        String url = properties.getDtKetiApiUrl() + "/fedit/light/digital-twins/" + DIGITAL_TWINS_ID + "/digital-objects/" + DIGITAL_OBJECT_ID + "_" + augment_seq;
        HttpEntity<String> request = new HttpEntity<>(headers);
        //ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.DELETE, request, String.class);
        //log.info("sendDigitalTwinObjectDelete response : " + response.getBody());
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
                String key = entry.getKey();
                String value = (String) entry.getValue();
                String filePath = value;
                List<Map<String, String>> datas = readCsv(filePath);
                // 데이터 리스트를 순회하며 각 변수들을 뽑아내기
                if (dataJsonArray.isEmpty() || dataJsonArray.length() == 0) {
                    for (Map<String, String> data : datas) {
                        // entrySet을 이용하여 순회
                        JSONObject jsonObject = new JSONObject();
                        for (Map.Entry<String, String> dataEntry : data.entrySet()) {
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
                List<Map<String, String>> csvData = JSONParser.readCsv(map.get("file_path").toString());
                JSONArray dataJsonArray = new JSONArray();
                if (csvData != null) { //Validation을 했지만 그대로 인것도 있음 그 부분은 건너 뛰기
                    //데이터 넣는 부분
                    for (Map<String, String> dataMap : csvData) {
                        JSONObject dataJsonObject = new JSONObject();
                        dataMap.keySet().forEach(key -> {
                            dataJsonObject.put(key, dataMap.get(key).toString());
                        });
                        dataJsonArray.put(dataJsonObject);
                    }
                    jsonObject.put("data", dataJsonArray);
                } else {
                    jsonObject.put("data", dataJsonArray);
                }
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
                List<Map<String, String>> csvData = JSONParser.readCsv(map.get("file_path").toString());
                JSONArray dataJsonArray = new JSONArray();
                if (csvData != null) { //Outlier를 했지만 그대로 인것도 있음 그 부분은 건너 뛰기
                    //데이터 넣는 부분
                    for (Map<String, String> dataMap : csvData) {
                        JSONObject dataJsonObject = new JSONObject();
                        dataMap.keySet().forEach(key -> {
                            dataJsonObject.put(key, dataMap.get(key).toString());
                        });
                        dataJsonArray.put(dataJsonObject);
                    }
                    jsonObject.put("data", dataJsonArray);
                } else {
                    jsonObject.put("data", dataJsonArray);
                }
                outlierDataJsonArray.put(jsonObject);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        return outlierDataJsonArray;
    }

    /**
     * sendIndividuallyData
     *
     * @param DIGITAL_TWINS_ID  디지털 트윈 아이디
     * @param DIGITAL_OBJECT_ID 디지털 오브젝트 아이디
     * @param count             한번 KETI에 올릴 데이터 업로드할 개수
     * @param array             보낼 데이터 JSONArray
     * @param AUGMENT_SEQ       증강 SEQ NUMBER
     *                          "data":[{date,m10,m20,m30},{...},{...}]
     * @apiNote http://{IP}:{PORT}/fedit/v1/digital-twins/{DIGITAL_TWINS_ID}/digital-objects/{DIGITAL_OBJECT_ID}/data
     */
    public static void sendIndividuallyData(BaseSystemProperties properties, int AUGMENT_SEQ, String DIGITAL_TWINS_ID, String DIGITAL_OBJECT_ID, JSONArray array, int count) {
        log.info("DIGITAL_TWINS_ID : " + DIGITAL_TWINS_ID);
        log.info("DIGITAL_OBJECT_ID : " + DIGITAL_OBJECT_ID);
        log.info("AUGMENT_SEQ : " + AUGMENT_SEQ);
        if (array == null) {
            log.info("Failed Condition");
            return;
        }
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        //KETI DigitalObjects Data Upload Url
        String url = properties.getDtKetiApiUrl() + "/fedit/v1/digital-twins/" + DIGITAL_TWINS_ID + "/digital-objects/" + DIGITAL_OBJECT_ID + "_" + AUGMENT_SEQ + "/data";
        log.info("url -> {}", url);

        if (count <= 1) {
            for (int i = 0; i < array.length(); i++) {
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("data", array.get(i));
                HttpEntity<String> request = new HttpEntity<>(jsonObject.toString(), headers);
                //String response = restTemplate.postForObject(url, request, String.class);
                //log.info("response : " + response);
            }
            log.info("DIGITAL_TWINS_ID : " + DIGITAL_TWINS_ID + ", DIGITAL_OBJECT_ID : " + DIGITAL_OBJECT_ID + ", AUGMENT_SEQ : " + AUGMENT_SEQ + ", Success KETI Server Data Upload");
        } else {
            // count 개수만큼 데이터를 묶어서 처리
            for (int i = 0; i < array.length(); i += count) {
                JSONObject jsonObject = new JSONObject();
                JSONArray dataBatch = new JSONArray();

                // count 개수만큼 데이터를 dataBatch에 추가
                for (int j = 0; j < count && i + j < array.length(); j++) {
                    dataBatch.put(array.get(i + j));
                }

                jsonObject.put("data", dataBatch);
                HttpEntity<String> request = new HttpEntity<>(jsonObject.toString(), headers);
                //String response = restTemplate.postForObject(url, request, String.class);
                //log.info("response : " + response);
                log.info("DIGITAL_TWINS_ID : " + DIGITAL_TWINS_ID + ", DIGITAL_OBJECT_ID : " + DIGITAL_OBJECT_ID + ", AUGMENT_SEQ : " + AUGMENT_SEQ + ", Success KETI Server Data Upload");
            }
        }
    }

    public static boolean checkCSV(String fileFullPath) {
        boolean check = true;
        log.info("checkCSV -> " + fileFullPath);
        try (FileReader fileReader = new FileReader(fileFullPath); BufferedReader br = new BufferedReader(fileReader)) {
            String line = null;
            boolean isFirstLine = true;
            while ((line = br.readLine()) != null) {
                if (line.endsWith(",")) {
                    check = false;
                    break;
                }
                String[] values = line.split(","); // CSV 파일을 쉼표로 분리하여 배열에 저장
                if (!check) {
                    break;
                }
                if (isFirstLine) {
                    isFirstLine = false;
                } else {
                    for (String value : values) {
                        if (value == null) {
                            check = false;
                            log.info("Value is null");
                            break;
                        } else if (value != null && value.length() == 0) {
                            check = false;
                            log.info("Value is null");
                            break;
                        }
                    }
                }
            }
        } catch (FileNotFoundException e) {
            e.printStackTrace();
            return false;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
        return check;
    }

    public static JSONObject getDataFormat(BaseSystemProperties properties, String digitalTwinId, String digitalObjectId) throws IOException {
        String url = properties.getDtKetiApiUrl() + "/fedit/v1/digital-twins/" + digitalTwinId + "/digital-objects/" + digitalObjectId + "/data";
        HashMap<String, Object> params = new HashMap<>();
        params.put("count", 1);
        StringBuilder stringBuilder = ProtocolBuilderHelper.setGetMethodParams(params);
        ProtocolBuilder protocolBuilder = new ProtocolBuilder().url(url + stringBuilder).conn().setRequestMethod("GET");
        String result = protocolBuilder.openReader("UTF-8", true);
        JSONArray jsonArray = new JSONArray(result);
        // JSON 문자열을 JSONObject로 변환합니다.
        JSONObject jsonObject = new JSONObject(jsonArray.get(0).toString());
        // 재구성할 JSON 객체를 만듭니다.
        JSONObject newJsonObject = new JSONObject();
        // 기존의 키와 값을 재배치하여 새로운 JSON 객체에 넣습니다.
        if (jsonObject.has("digital_twin_id")) {
            newJsonObject.put("digital_twin_id", jsonObject.get("digital_twin_id"));
        }
        if (jsonObject.has("digital_object_id")) {
            newJsonObject.put("digital_object_id", jsonObject.get("digital_object_id"));
        }
        if (jsonObject.has("rowtime")) {
            newJsonObject.put("rowtime", jsonObject.get("rowtime"));
        }
        if (jsonObject.has("data")) {
            JSONObject dataObject = jsonObject.getJSONObject("data");

            // 중첩된 'data' 객체를 처리합니다.
            JSONObject newDataObject = new JSONObject();

            Iterator<String> keys = dataObject.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                Object value = dataObject.get(key);

                if (value instanceof JSONObject) {
                    newDataObject.put(key, (JSONObject) value);
                } else if (value instanceof JSONArray) {
                    newDataObject.put(key, (JSONArray) value);
                } else {
                    newDataObject.put(key, value);
                }
            }

            newJsonObject.put("data", newDataObject);
        }

        if (jsonObject.has("location")) {
            newJsonObject.put("location", jsonObject.get("location"));
        }

        // 재구성된 JSON 객체를 출력합니다.
        log.info(newJsonObject.toString());

        // 키와 대응하는 대체 값을 저장하는 맵을 만듭니다.
        /*Map<String, String> keyReplacementMap = new HashMap<>();
        keyReplacementMap.put("BTYPE", "대체");
        keyReplacementMap.put("RAIN5", "9999");*/
        // 재구성할 JSON 객체를 만듭니다.
        /*JSONObject replaceObject = replaceValuesByKey(jsonObject, keyReplacementMap);
        log.info("replaceObject -> {}", replaceObject);*/
        return newJsonObject;
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

    //formattedIndividuallyDataArray 보내야 되는 데이터
    //csvData 마지막 파일 원본 데이터
    public static JSONArray recoveredDataFormat(JSONArray formattedIndividuallyDataArray, List<Map<String, String>> csvData) {
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

    public static List<Map<String, String>> convertJsonArrayToListOfMaps(JSONArray jsonArray) {
        List<Map<String, String>> listOfMaps = new ArrayList<>();

        for (int i = 0; i < jsonArray.length(); i++) {
            JSONObject jsonObject = jsonArray.getJSONObject(i);
            Map<String, String> map = new HashMap<>();

            for (String key : jsonObject.keySet()) {
                map.put(key, jsonObject.getString(key));
            }

            listOfMaps.add(map);
        }

        return listOfMaps;
    }

    public static List<String> readHeaders(String filePath, int limitCsvRowCount) throws IOException {
        List<String> headers = new ArrayList<>();
        String line;
        int rowCount = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(filePath), "UTF-8"))) {
            while ((line = br.readLine()) != null && rowCount < limitCsvRowCount) {
                String[] stringArray = line.split(",", -1);
                if (headers.isEmpty()) {
                    for (String header : stringArray) {
                        headers.add(header.replace("\"", ""));
                    }
                }
                rowCount++;
            }
        }
        return headers;
    }
}