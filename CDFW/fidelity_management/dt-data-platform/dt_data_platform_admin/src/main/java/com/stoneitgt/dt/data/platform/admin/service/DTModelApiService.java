package com.stoneitgt.dt.data.platform.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.enums.ModelType;
import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.*;
import lombok.EqualsAndHashCode;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
@EqualsAndHashCode(callSuper = false) // 상위 클래스의 equals/hashCode 제외 (신중하게 사용)
public class DTModelApiService extends APIService {
    //사용자 업로드 파일로 프로세스 태우기
    public ResponseEntity<?> makeUserUploadBaseDataFile(ModelType type, Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        switch (type) {
            case META_ETC_MODEL: {
                params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("user_tmp_key").toString());
                break;
            }
            case META_MODEL: {
                params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("user_tmp_key").toString());
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        params.put("file_name", param.get("file_name").toString());
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorMakeUserUploadBaseDataSet/", params));
    }

    //초기 가져오는 갯수만 제한을 둘 조건 없는 데이터
    public ResponseEntity<?> makeBaseDataFile(ModelType type, Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        switch (type) {
            case META_ETC_MODEL: {
                params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("user_tmp_key").toString());
                break;
            }
            case META_MODEL: {
                params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("user_tmp_key").toString());
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        params.put("file_name", param.get("user_tmp_key").toString() + "_origin" + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv");
        params.put("data", param.get("data"));
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorMakeBaseDataSet/", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> checkIndexTimeColumn(ModelType type, Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        switch (type) {
            case META_ETC_MODEL: {
                params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
                break;
            }
            case META_MODEL: {
                params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        params.put("base_file_name", param.get("base_file_nm").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorCheckIndexTimeColumn/", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeBaseDataSetRangeRow(ModelType type, Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        switch (type) {
            case META_ETC_MODEL: {
                params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
                break;
            }
            case META_MODEL: {
                params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        params.put("target_file_name", StringUtil.changeFileName(param.get("base_file_nm").toString(), "_set_row"));
        params.put("base_file_name", param.get("base_file_nm").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        params.put("target_start_date", param.get("target_start_date").toString());
        params.put("target_end_date", param.get("target_end_date").toString());
        params.put("target_row_count", param.get("target_row_count").toString());
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorMakeBaseDataSetRangeRow/", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeBaseDataSetRangeCol(ModelType type, Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        String base_file_path = param.get("last_file_path").toString();
        switch (type) {
            case META_ETC_MODEL: {
                if ("U".equals(param.get("form_type").toString())) {
                    params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + base_file_path.substring(0, base_file_path.length() - 1));
                } else {
                    params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_dir").toString());
                }
                break;
            }
            case META_MODEL: {
                if ("U".equals(param.get("form_type").toString())) {
                    params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + base_file_path.substring(0, base_file_path.length() - 1));
                } else {
                    params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_dir").toString());
                }
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        params.put("target_file_name", StringUtil.changeFileName(param.get("base_file_nm").toString(), "_set_col"));
        params.put("base_file_name", param.get("base_file_nm_set_range_row").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        params.put("preproc_trgt_col", MetaRelateUtil.parseJSONStringToArray(param.get("preproc_trgt_col").toString()));
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorMakeBaseDataSetRangeCol/", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getDataSetColumnListInfo(ModelType type, Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        String base_file_path = param.get("base_file_path").toString();
        switch (type) {
            case META_ETC_MODEL: {
                if ("U".equals(param.get("form_type").toString())) {
                    params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + base_file_path.substring(0, base_file_path.length() - 1));
                } else {
                    params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + base_file_path);
                }
                break;
            }
            case META_MODEL: {
                if ("U".equals(param.get("form_type").toString())) {
                    params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + base_file_path.substring(0, base_file_path.length() - 1));
                } else {
                    params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + base_file_path);
                }
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        params.put("file_name", param.get("base_file_nm").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorDatasetInfo/", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getResourceDts(Map<String, Object> params) throws UnsupportedEncodingException {
        return ResponseEntity.ok(requestMetaDataApi("/meta/api/v1/resource/dts", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getResourceObject(Map<String, Object> params) throws UnsupportedEncodingException {
        return ResponseEntity.ok(requestMetaDataApi("/meta/api/v1/resource/objects", params));
    }

    // 디지털 트윈 메타 전체 데이터
    public ResponseEntity<?> getResourceObjectDetailFull(Map<String, Object> params) throws UnsupportedEncodingException {
        return ResponseEntity.ok(requestMetaDataApi("/meta/api/v1/resource/full-objects/" + params.get("object_id") + "?arrayDataLimitYn=Y&arrayDataLimit=50", params));
    }

    // 디지털 트윈 오브젝트 데이터 (기간 또는 개수 또는 둘다)
    public ResponseEntity<?> getResourceObjectData(Map<String, Object> params, boolean isLimit, int limit) {
        String digital_twins = params.get("digital_twins").toString();
        String digital_objects = params.get("digital_objects").toString();
        String count_range = null;

        if (params.get("target_row_count") != null) {
            int target_row_count = Integer.parseInt(params.get("target_row_count").toString());
            if (isLimit) {
                count_range = "count=" + Math.min(target_row_count, limit);
            } else {
                if (target_row_count != 0) {
                    count_range = "count=" + target_row_count;
                }
            }
        } else {
            if (isLimit) {
                count_range = "count=" + limit;
            }
        }

        String target_start_date = params.get("target_start_date") != null ? params.get("target_start_date").toString() : null;
        String target_end_date = params.get("target_end_date") != null ? params.get("target_end_date").toString() : null;
        String date_range = null;
        if (target_start_date != null && target_end_date != null) {
            // 날짜가 존재할 때
            String fromDate = TimeUtil.parseToYYYYMMDDHHMMSSFromZoneDateTime(TimeUtil.parseToYYYYMMDDHHMMSS(false, target_start_date));
            String toDate = TimeUtil.parseToYYYYMMDDHHMMSSFromZoneDateTime(TimeUtil.parseToYYYYMMDDHHMMSS(true, target_end_date));
            date_range = "from=" + fromDate + "&to=" + toDate;
        }

        String requestDataApiUrl = "/fedit/v1/digital-twins/" + digital_twins + "/digital-objects/" + digital_objects + "/data";

        if (date_range != null) {
            return ResponseEntity.ok(requestDataApi(requestDataApiUrl + "?" + date_range + (count_range != null ? "&" + count_range : ""), params));
        } else {
            return ResponseEntity.ok(requestDataApi(requestDataApiUrl + (count_range != null ? "?" + count_range : ""), params));
        }
    }

    // 디지털 트윈 오브젝트 데이터 가져오고 파싱까지 진행하여 List<Map<String, Object>> 데이터 형태로 로드
    public List<Map<String, Object>> getResourceObjectDataAndParse(Map<String, Object> params, Map<String, Object> metaDepth) throws IOException {
        String dataDepth = metaDepth.get("data_depth_1").toString();
        String dataTimeYn = metaDepth.get("data_time_yn").toString();
        params.put("data_time_yn", dataTimeYn);
        ResponseEntity<?> resultResourceObjectData = params.get("limit") != null ?
                getResourceObjectData(params, true, Integer.parseInt(params.get("limit").toString())) : getResourceObjectData(params, false, 0);
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode rootNodePath = objectMapper.readTree(resultResourceObjectData.getBody().toString());

        String[] depthKeys = dataDepth.split("\\.");
        List<JsonNode> nodesToProcess = new ArrayList<>();

        if (rootNodePath.isArray()) {
            for (JsonNode arrayItem : rootNodePath) {
                nodesToProcess.add(arrayItem);
            }
        } else {
            nodesToProcess.add(rootNodePath);
        }

        for (String key : depthKeys) {
            List<JsonNode> nextNodesToProcess = new ArrayList<>();

            for (JsonNode node : nodesToProcess) {
                JsonNode nextNode = node.path(key);
                if (!nextNode.isMissingNode()) {
                    nextNodesToProcess.add(nextNode);
                }
            }

            nodesToProcess = nextNodesToProcess;
        }

        List<Map<String, Object>> resultList = new ArrayList<>();

        for (int i = 0; i < nodesToProcess.size(); i++) {
            JsonNode finalNode = nodesToProcess.get(i); // nodesToProcess의 i번째 노드 가져오기
            JsonNode rootNode = rootNodePath.get(i);
            if (finalNode.isArray()) {
                for (JsonNode arrayItem : finalNode) {
                    Map<String, Object> map = objectMapper.convertValue(arrayItem, new TypeReference<Map<String, Object>>() {
                    });

                    if ("N".equals(params.get("data_time_yn"))) {
                        String rowtime = arrayItem.path("rowtime").asText();
                        if (rowtime.isEmpty()) {
                            rowtime = TimeUtil.formatZonedDateTimeStringToDateTimeFormat(rootNode.path("rowtime").asText());
                        }
                        map.put("rowtime", rowtime);
                    }

                    resultList.add(map);
                }
            } else {
                Map<String, Object> map = objectMapper.convertValue(finalNode, new TypeReference<Map<String, Object>>() {
                });

                if ("N".equals(params.get("data_time_yn"))) {
                    String rowtime = finalNode.path("rowtime").asText();
                    if (rowtime.isEmpty()) {
                        rowtime = TimeUtil.formatZonedDateTimeStringToDateTimeFormat(rootNode.path("rowtime").asText());
                    }
                    map.put("rowtime", rowtime);
                }
                resultList.add(map);
            }
        }
        return resultList;
    }

    public ResponseEntity<?> makeBaseSimulationDataFile(Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", param.get("file_path"));
        params.put("file_name", param.get("file_name"));
        params.put("data", param.get("data"));
        params.put("index_trgt_col", param.get("index_trgt_col"));
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorMakeBaseDataSet/", params));
    }

    public ResponseEntity<?> makeValidateSet(Map<String, Object> params) {
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorDatasetVerify/", params));
    }

    public ResponseEntity<?> makeOutlierSet(Map<String, Object> params, String type) {
        switch (type) {
            case "standard":
                return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorOutlierStandardDeviation/", params));
            case "kmean":
                return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorOutlierKMeans/", params));
            case "dbscan":
                return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorOutlierDBscan/", params));
            case "autoencoder":
            case "AutoEncoder":
            case "Auto Encoder":
            case "auto encoder":
                return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorDataAEGenerater/", params));
            default:
                throw new RuntimeException();
        }
    }

    public ResponseEntity<?> makeInterpolateSet(Map<String, Object> params, String type) {
        switch (type.toUpperCase()) {
            case "DECISIONTREE": {
                return ResponseEntity.ok(requestPythonApi("/dt/example/processorDecisionTree/", params));
            }
            case "RANDOM FOREST": {
                return ResponseEntity.ok(requestPythonApi("/dt/newaugment/augmentCreate_randomForest/", params));
            }
            case "BRITS": {
                return ResponseEntity.ok(requestPythonApi("/dt/newaugment/augmentCreate_brits_ori/", params));
            }
            case "NAOMI": {
                return ResponseEntity.ok(requestPythonApi("/dt/newaugment/augmentCreate_naomi/", params));
            }
            default: {
                return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorDatasetInterpolate/", params));
            }
        }
    }

    public ResponseEntity<?> makeInterpolateModelDecisionSet(Map<String, Object> params) {
        return ResponseEntity.ok(requestPythonApi("/dt/example/processorDecisionTree_model/", params));
    }

    public ResponseEntity<?> makeResampleSet(Map<String, Object> params) {
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorDatasetResample/", params));
    }

    public ResponseEntity<?> makeUnitSet(Map<String, Object> params) {
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorDatasetUnitConverter/", params));
    }

    public ResponseEntity<?> getIndexColumnTimeCheck(Map<String, Object> params) {
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorDateTimeCheck/", params));
    }

    public HashMap<String, Object> makeDataNormalize(JsonNode infoNode, String dateFormat) throws ParseException {
        HashMap<String, Object> result = new HashMap<>();
        // 'info' 객체의 키들을 추출
        Iterator<String> fieldNames = infoNode.fieldNames();

        List<String> headers = new ArrayList<>(); // 헤더를 담을 리스트
        /**
         * 헤더 설정 넣기
         * */
        while (fieldNames.hasNext()) {
            String fieldName = fieldNames.next();
            headers.add(fieldName);
        }

        JSONObject jsonObject = new JSONObject();
        for (int i = 0; i < headers.size(); i++) {
            JsonNode jsonNode = infoNode.get(headers.get(i));
            ArrayList<String> data = new ArrayList<>();
            for (JsonNode value : jsonNode) {
                data.add(value.asText());
            }
            jsonObject.put(headers.get(i), data);
        }

        // 데이터를 키에 매칭되는 순서대로 쌍으로 묶기
        List<List<String>> datasList = new ArrayList<>(); // 데이터를 담을 리스트
        int dataSize = jsonObject.getJSONArray(headers.get(0)).length();
        for (int i = 0; i < dataSize; i++) {
            ArrayList<String> data = new ArrayList<>();
            for (int j = 0; j < headers.size(); j++) {
                if (j == 0) {
                    // 시간 형태 포맷팅
                    String dateString = jsonObject.getJSONArray(headers.get(j)).get(i).toString();
                    String detectedFormat = ConvertUtil.tryParseFindFormat(ConvertUtil.DATEFORMATS, dateString);
                    SimpleDateFormat inputFormat = new SimpleDateFormat(detectedFormat);
                    SimpleDateFormat outputFormat = new SimpleDateFormat(dateFormat); // 원하는 출력 형식
                    Date parsedDate = inputFormat.parse(dateString);
                    data.add(outputFormat.format(parsedDate));
                } else {
                    data.add(jsonObject.getJSONArray(headers.get(j)).get(i).toString());
                }
            }
            datasList.add(data);
        }
        result.put("headers", headers);
        result.put("datas", datasList);
        return result;
    }

    public HashMap<String, Object> makeDataNormalizeKMean(JsonNode infoNode, String excludeGroup, String dateFormat) throws ParseException {
        HashMap<String, Object> result = new HashMap<>();

        // 'info' 객체의 키들을 추출
        Iterator<String> groupNames = infoNode.fieldNames();

        List<String> groups = new ArrayList<>(); // 그룹을 담을 리스트

        while (groupNames.hasNext()) {
            String fieldName = groupNames.next();
            groups.add(fieldName);
        }

        List<String> headers = new ArrayList<>(); // 헤더를 담을 리스트
        for (String group : groups) {
            if (group.equals("max")) {
                // 'max' 키에서 첫 번째 항목의 필드 이름을 헤더로 사용
                JsonNode maxNode = infoNode.path("max").get(0);
                if (maxNode != null) {
                    Iterator<String> headerFields = maxNode.fieldNames();
                    while (headerFields.hasNext()) {
                        String header = headerFields.next();
                        headers.add(header);
                    }
                    break; // 'max'에서만 헤더를 추출하면 되므로 루프 종료
                }
            }
        }
        List<List<String>> rows = new ArrayList<>(); // 데이터를 담을 리스트
        for (String group : groups) {
            if (Objects.equals(excludeGroup, group)) { //{excludeGroup} 제외 데이터 담는다
                continue;
            }
            JsonNode groupArrayNode = infoNode.path(group);
            // 데이터를 키에 매칭되는 순서대로 쌍으로 묶기
            // JsonNode 배열을 순회
            for (JsonNode node : groupArrayNode) {
                // 각 요소의 필드 값 추출
                List<String> row = new ArrayList<>();
                for (Iterator<String> fields = node.fieldNames(); fields.hasNext(); ) {
                    String field = fields.next();
                    if (headers.get(0).equals(field)) {
                        // 시간 형태 포맷팅
                        String dateString = node.get(field).asText();
                        String detectedFormat = ConvertUtil.tryParseFindFormat(ConvertUtil.DATEFORMATS, dateString);
                        SimpleDateFormat inputFormat = new SimpleDateFormat(detectedFormat);
                        SimpleDateFormat outputFormat = new SimpleDateFormat(dateFormat); // 원하는 출력 형식
                        Date parsedDate = inputFormat.parse(dateString);
                        row.add(outputFormat.format(parsedDate));
                    } else {
                        row.add(node.get(field).asText());
                    }
                }
                rows.add(row);
            }
        }

        result.put("headers", headers);
        result.put("datas", rows);
        return result;
    }

    public HashMap<String, Object> makeDataNormalizeDBSCAN(JsonNode infoNode, String dateFormat) throws ParseException {
        HashMap<String, Object> result = new HashMap<>();
        // 'info' 객체의 키들을 추출
        Iterator<String> groupNames = infoNode.fieldNames();

        List<String> groups = new ArrayList<>(); // 그룹을 담을 리스트

        while (groupNames.hasNext()) {
            String fieldName = groupNames.next();
            groups.add(fieldName);
        }

        List<String> headers = new ArrayList<>(); // 헤더를 담을 리스트
        for (String group : groups) {
            //첫 번째 항목의 필드 이름을 헤더로 사용
            JsonNode maxNode = infoNode.path(group).get(0);
            if (maxNode != null) {
                Iterator<String> headerFields = maxNode.fieldNames();
                while (headerFields.hasNext()) {
                    String header = headerFields.next();
                    headers.add(header);
                }
                break; // 'max'에서만 헤더를 추출하면 되므로 루프 종료
            }
        }
        List<List<String>> rows = new ArrayList<>(); // 데이터를 담을 리스트
        log.info("groups -> {}", groups);
        for (String group : groups) {
            JsonNode groupArrayNode = infoNode.path(group);
            // 데이터를 키에 매칭되는 순서대로 쌍으로 묶기
            // JsonNode 배열을 순회
            for (JsonNode node : groupArrayNode) {
                // 각 요소의 필드 값 추출
                List<String> row = new ArrayList<>();
                for (Iterator<String> fields = node.fieldNames(); fields.hasNext(); ) {
                    String field = fields.next();
                    if (headers.get(0).equals(field)) {
                        // 시간 형태 포맷팅
                        String dateString = node.get(field).asText();
                        String detectedFormat = ConvertUtil.tryParseFindFormat(ConvertUtil.DATEFORMATS, dateString);
                        SimpleDateFormat inputFormat = new SimpleDateFormat(detectedFormat);
                        SimpleDateFormat outputFormat = new SimpleDateFormat(dateFormat); // 원하는 출력 형식
                        Date parsedDate = inputFormat.parse(dateString);
                        row.add(outputFormat.format(parsedDate));
                    } else {
                        row.add(node.get(field).asText());
                    }
                }
                rows.add(row);
            }
        }

        log.info("headers -> {}", headers);
        log.info("datas -> {}", rows);
        log.info("datas size -> {}", rows.size());

        result.put("headers", headers);
        result.put("datas", rows);
        return result;
    }

    public HashMap<String, Object> dataTimeDivider(String dateKey, List<String> headers, List<List<String>> datas) {
        int dateIndex = MetaRelateUtil.findDateIndex(headers, dateKey);
        //시간만 담기
        List<Date> dates = new ArrayList<>();
        for (List<String> row : datas) {
            dates.add(ConvertUtil.tryParse(ConvertUtil.DATEFORMATS, row.get(dateIndex).toString()));
        }

        //시간 간격 계산
        List<Long> timeDeltas = new ArrayList<>();
        for (int i = 0; i < dates.size() - 1; i++) {
            long diffInMillies = Math.abs(dates.get(i + 1).getTime() - dates.get(i).getTime());
            long diffInSeconds = diffInMillies / 1000; // 밀리초를 초 단위로 변환
            timeDeltas.add(diffInSeconds);
        }

        //평균 시간 간격 계산
        long sum = 0;
        for (Long delta : timeDeltas) {
            sum += delta;
        }
        double averageDelta = (double) sum / timeDeltas.size();

        // 간격 분석 및 시간 단위 판별
        TimeUnit unit = TimeUnit.getUnit(averageDelta);

        log.info("평균 시간 간격: {}초", averageDelta);
        HashMap<String, Object> result = new HashMap<>();
        result.put("unit", unit);
        result.put("delta", averageDelta);
        return result;
    }

    // LSTM, GRU
    public ResponseEntity<?> makeContinuousAugmentRepeatInterpolationSet(Map<String, Object> params) {
        return ResponseEntity.ok(requestPythonApi("/dt/newaugment/augmentCreate_interpolation/", params));
    }

    // DEEP AR
    public ResponseEntity<?> makeContinuousDeepARAugmentRepeatInterpolationSet(Map<String, Object> params) {
        return ResponseEntity.ok(requestPythonApi("/dt/newaugment/augmentCreate_deepAR_interpolation/", params));
    }

    // N-Beats
    public ResponseEntity<?> makeContinuousNBeatsAugmentRepeatInterpolationSet(Map<String, Object> params) {
        return ResponseEntity.ok(requestPythonApi("/dt/newaugment/augmentCreate_nbeats_interpolation/", params));
    }

    // SEG_RNN
    public ResponseEntity<?> makeContinuousSEGRNNAugmentRepeatInterpolationSet(Map<String, Object> params) {
        return ResponseEntity.ok(requestPythonApi("/dt/newaugment/augmentCreate_seg_rnn_interpolation/", params));
    }

    // Outlier
    public ResponseEntity<?> detectOutlier(Map<String, Object> params, String type) {
        log.info("detectOutlier -> {}", type);
        switch (type) {
            case "standard":
                return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorOutlierStandardDeviation/", params));
            case "kmean":
                return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorOutlierKMeans/", params));
            case "dbscan":
                return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorOutlierDBscan/", params));
            case "autoencoder":
            case "AutoEncoder":
            case "Auto Encoder":
            case "auto encoder":
                return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorDataAEGenerater/", params));
            default:
                throw new RuntimeException("Outlier type is mismatched");
        }
    }

    // Correlation
    public ResponseEntity<?> correlation(Map<String, Object> params) {
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorDatasetCorrelationOption/", params));
    }

    /**
     * 동기화 엔진 데이터 업로드 부분
     * */
    /**
     * sendDigitalTwinObjectCreatedData
     *
     * @param DIGITAL_TWINS_ID 디지털 트윈 아이디
     * @param createdJSONData  디지털 트윈 객체 생성 데이터
     *                         {"digital_object_identifier":"KR-light", "digital_object_name":"test"}
     * @apiNote http://{IP}:{PORT}/fedit/light/digital-twins/{DIGITAL_TWINS_ID}/digital-objects
     * @author kimwoosik
     */
    public boolean sendDigitalTwinObjectCreated(String DIGITAL_TWINS_ID, JSONObject createdJSONData) {
        log.info("sendDigitalTwinCreatedData : " + ", DIGITAL_TWINS_ID : " + DIGITAL_TWINS_ID + ", createdJSONData : " + createdJSONData);
        //KETI DigitalObjects Created Data Upload Url
        String endpoint = "/fedit/light/digital-twins/" + DIGITAL_TWINS_ID + "/digital-objects";
        String response = requestDataPostApi(endpoint, createdJSONData.toString(), HttpMethod.POST);
        log.info("sendDigitalTwinObjectCreated response : " + response);
        return true;
    }

    /**
     * sendDigitalTwinObjectDeleteData
     *
     * @param
     * @apiNote http://{IP}:{PORT}/fedit/light/digital-twins/{DIGITAL_TWINS_ID}/digital-objects/{DIGITAL_TWINS_OBJECT_ID + _AUGMENT_SEQ}
     */
    public boolean sendDigitalTwinObjectDelete(String DIGITAL_TWINS_ID, String DIGITAL_OBJECT_ID, int augment_seq) {
        log.info("sendDigitalTwinObjectDelete : " + ", DIGITAL_TWINS_ID : " + DIGITAL_TWINS_ID + ", DIGITAL_OBJECT_ID : " + DIGITAL_OBJECT_ID + ", augment_seq : " + augment_seq);
        //KETI DigitalObjects Delete Url
        String endpoint = "/fedit/light/digital-twins/" + DIGITAL_TWINS_ID + "/digital-objects/" + DIGITAL_OBJECT_ID + "_" + augment_seq;
        String response = requestDataPostApi(endpoint, null, HttpMethod.DELETE);
        log.info("sendDigitalTwinObjectDelete response : " + response);
        return true;
    }

    public boolean sendIndividuallyData(int AUGMENT_SEQ, String DIGITAL_TWINS_ID, String DIGITAL_OBJECT_ID, JSONArray array, int count) {
        log.info("DIGITAL_TWINS_ID : " + DIGITAL_TWINS_ID);
        log.info("DIGITAL_OBJECT_ID : " + DIGITAL_OBJECT_ID);
        log.info("AUGMENT_SEQ : " + AUGMENT_SEQ);

        if (array == null || array.length() == 0) {
            log.info("Empty or null array received");
            return false;
        }

        String endpoint = "/fedit/v1/digital-twins/" + DIGITAL_TWINS_ID
                + "/digital-objects/" + DIGITAL_OBJECT_ID + "_" + AUGMENT_SEQ + "/data";

        int totalCalls = (int) Math.ceil((double) array.length() / count);
        int threadCount = 5; // 최대 동시 실행 Thread 수
        int callsPerThread = (int) Math.ceil((double) totalCalls / threadCount);

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        for (int t = 0; t < threadCount; t++) {
            final int threadIndex = t;
            executor.submit(() -> {
                int startCall = threadIndex * callsPerThread;
                int endCall = Math.min(startCall + callsPerThread, totalCalls);

                for (int callIndex = startCall; callIndex < endCall; callIndex++) {
                    int startIndex = callIndex * count;
                    int endIndex = Math.min(startIndex + count, array.length());

                    JSONArray dataBatch = new JSONArray();

                    for (int i = startIndex; i < endIndex; i++) {
                        Object data = array.get(i); // ✅ array.get() 딱 1번만!
                        dataBatch.put(data);
                    }

                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("data", dataBatch);

                    try {
                        String response = requestDataPostApi(endpoint, jsonObject.toString(), HttpMethod.POST);
                        log.info("sendIndividuallyData response (Thread {}): {}", Thread.currentThread().getName(), response);
                    } catch (Exception e) {
                        log.error("Error in Thread {}: {}", Thread.currentThread().getName(), e.getMessage(), e);
                    }
                }
            });
        }

        executor.shutdown();
        log.info("KETI Server Data Upload initiated (batch size: {}, threads: {})", count, threadCount);
        return true;
    }

    public boolean sendValidationData(JSONObject jsonObject) {
        log.info("sendValidationData");
        String endpoint = "/fedit/v1/validations";
        log.info("endpoint -> {}", endpoint);

        try {
            List<JSONObject> chunkedJsons = splitValidationData(jsonObject, 20);

            for (int i = 0; i < chunkedJsons.size(); i++) {
                JSONObject chunkJson = chunkedJsons.get(i);
                log.info("Sending validation chunk {}/{}", i + 1, chunkedJsons.size());

                String response = requestDataPostApi(endpoint, chunkJson.toString(), HttpMethod.POST);
                log.info("sendValidationData response -> {}", response);
            }

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean sendOutlierData(JSONObject jsonObject) {
        log.info("sendOutlierData");
        String endpoint = "/fedit/v1/outliers";
        log.info("endpoint -> {}", endpoint);

        try {
            List<JSONObject> chunkedJsons = splitOutlierData(jsonObject, 20);

            for (int i = 0; i < chunkedJsons.size(); i++) {
                JSONObject chunkJson = chunkedJsons.get(i);
                log.info("Sending chunk {}/{}", i + 1, chunkedJsons.size());

                String response = requestDataPostApi(endpoint, chunkJson.toString(), HttpMethod.POST);
                log.info("sendOutlierData response -> {}", response);
            }

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean sendErrorData(Map<String, Object> errorInfo) throws Exception {
        log.info("sendErrorData");
        String endpoint = "/fedit/v1/errors";
        log.info("endpoint -> {}", endpoint);
        try {
            String response = requestDataPostApi(endpoint, JSONParser.convertToJsonString(errorInfo), HttpMethod.POST);
            log.info("sendErrorData -> {}", response);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return true;
        }
    }


    private List<JSONObject> splitValidationData(JSONObject jsonObject, int chunkSize) {
        List<JSONObject> chunkedList = new ArrayList<>();

        JSONArray validationArray = jsonObject.getJSONArray("validation");
        if (validationArray.isEmpty()) {
            return chunkedList;
        }
        JSONObject validationObj = validationArray.getJSONObject(0);
        JSONArray dataArray = validationObj.getJSONArray("data");

        for (int i = 0; i < dataArray.length(); i += chunkSize) {
            int end = Math.min(i + chunkSize, dataArray.length());
            JSONArray chunkData = new JSONArray();

            for (int j = i; j < end; j++) {
                chunkData.put(dataArray.getJSONObject(j));
            }

            // 전체 원본 JSON 깊은 복사
            JSONObject newJson = new JSONObject(jsonObject.toString());

            // validation[0].data만 바꾸기
            newJson.getJSONArray("validation").getJSONObject(0).put("data", chunkData);

            // optional: 전송 chunk 정보 삽입
            newJson.put("chunk_index", (i / chunkSize) + 1);
            newJson.put("chunk_total", (int) Math.ceil(dataArray.length() / (double) chunkSize));

            chunkedList.add(newJson);
        }

        return chunkedList;
    }

    // data 배열을 쪼개서 여러 JSONObject로 분할
    private List<JSONObject> splitOutlierData(JSONObject jsonObject, int chunkSize) {
        List<JSONObject> chunkedList = new ArrayList<>();

        JSONArray outlierArray = jsonObject.getJSONArray("outlier");
        if (outlierArray.isEmpty()) {
            return chunkedList;
        }
        JSONObject outlierObj = outlierArray.getJSONObject(0);
        JSONArray dataArray = outlierObj.getJSONArray("data");

        for (int i = 0; i < dataArray.length(); i += chunkSize) {
            int end = Math.min(i + chunkSize, dataArray.length());
            JSONArray chunkData = new JSONArray();

            for (int j = i; j < end; j++) {
                chunkData.put(dataArray.getJSONObject(j));
            }

            // 전체 원본 JSON 복사
            JSONObject newJson = new JSONObject(jsonObject.toString());

            // outlier[0].data 만 교체
            newJson.getJSONArray("outlier").getJSONObject(0).put("data", chunkData);

            // 필요시 추가 정보 넣기 (선택 사항)
            newJson.put("chunk_index", (i / chunkSize) + 1);
            newJson.put("chunk_total", (int) Math.ceil(dataArray.length() / (double) chunkSize));
            chunkedList.add(newJson);
        }
        return chunkedList;
    }
}
