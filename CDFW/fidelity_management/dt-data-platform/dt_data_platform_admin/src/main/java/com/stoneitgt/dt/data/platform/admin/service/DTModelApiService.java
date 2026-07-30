package com.stoneitgt.dt.data.platform.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.stoneitgt.dt.data.platform.enums.ModelType;
import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.ConvertUtil;
import com.stoneitgt.dt.data.platform.util.MetaRelateUtil;
import com.stoneitgt.dt.data.platform.util.StringUtil;
import lombok.EqualsAndHashCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

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

    /**
     * {
     *     "file_path": "D:/DT_FILE_TMP/DT_META_FILE/files/storage/augment/2026/05/99",
     *     "file_name": "99_46_admin_20260506091554_outlier.csv",
     *     "index_trgt_col": "rowtime",
     *     "feature": "co2"
     * }
     * */
    public ResponseEntity<?> checkOutlierSet(Map<String, Object> params) {
        return ResponseEntity.ok(requestPythonApi("/dt/newpreproc/processorEmptyCheck/", params));
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

        ObjectNode jsonObject = new ObjectMapper().createObjectNode();
        for (int i = 0; i < headers.size(); i++) {
            JsonNode jsonNode = infoNode.get(headers.get(i));
            ArrayNode data = jsonObject.putArray(headers.get(i));
            for (JsonNode value : jsonNode) {
                data.add(value.asText());
            }
        }

        // 데이터를 키에 매칭되는 순서대로 쌍으로 묶기
        List<List<String>> datasList = new ArrayList<>(); // 데이터를 담을 리스트
        int dataSize = jsonObject.get(headers.get(0)).size();
        for (int i = 0; i < dataSize; i++) {
            ArrayList<String> data = new ArrayList<>();
            for (int j = 0; j < headers.size(); j++) {
                if (j == 0) {
                    // 시간 형태 포맷팅 — asText() 필수(toString() 은 따옴표가 포함되어 날짜 파싱이 실패한다)
                    String dateString = jsonObject.get(headers.get(j)).get(i).asText();
                    String detectedFormat = ConvertUtil.tryParseFindFormat(ConvertUtil.DATEFORMATS, dateString);
                    SimpleDateFormat inputFormat = new SimpleDateFormat(detectedFormat);
                    SimpleDateFormat outputFormat = new SimpleDateFormat(dateFormat); // 원하는 출력 형식
                    Date parsedDate = inputFormat.parse(dateString);
                    data.add(outputFormat.format(parsedDate));
                } else {
                    data.add(jsonObject.get(headers.get(j)).get(i).asText());
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
            Date dateTry = ConvertUtil.tryParse(ConvertUtil.DATEFORMATS, row.get(dateIndex).toString());
            if (dateTry != null) {
                dates.add(dateTry);
            }
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
        /*TODO AUTO ENCODER TYPE 통합해야함*/
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

}
