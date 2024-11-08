package com.stoneitgt.dt.data.platform.admin.service;

import java.io.UnsupportedEncodingException;
import java.util.*;

import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.*;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DTModelApiService extends BaseService {

    @Autowired
    private APIService apiService;

    public ResponseEntity<?> makeUserUploadBaseDataFile(Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("user_tmp_key").toString());
        params.put("file_name", param.get("file_name").toString());
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorMakeUserUploadBaseDataSet/", params));
    }

    public ResponseEntity<?> makeBaseDataFile(Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemProperties.getDtMetaFilePath() + "/tmp/" + param.get("user_tmp_key").toString());
        params.put("file_name", param.get("user_tmp_key").toString() + "_origin" + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv");
        params.put("data", param.get("data"));
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorMakeBaseDataSet/", params));
    }

    public ResponseEntity<?> makeBaseSimulationDataFile(Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", param.get("file_path"));
        params.put("file_name", param.get("file_name"));
        params.put("data", param.get("data"));
        params.put("index_trgt_col", param.get("index_trgt_col"));
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorMakeBaseDataSet/", params));
    }

    public ResponseEntity<?> checkIndexTimeColumn(Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
        params.put("base_file_name", param.get("base_file_nm").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorCheckIndexTimeColumn/", params));
    }

    public ResponseEntity<?> makeBaseDataSetRangeRow(Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
        params.put("target_file_name", StringUtil.changeFileName(param.get("base_file_nm").toString(), "_set_row"));
        params.put("base_file_name", param.get("base_file_nm").toString());

        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        params.put("target_start_date", param.get("target_start_date").toString());
        params.put("target_end_date", param.get("target_end_date").toString());
        params.put("target_row_count", param.get("target_row_count").toString());

        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorMakeBaseDataSetRangeRow/", params));
    }

    public ResponseEntity<?> makeBaseDataSetRangeCol(Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        String base_file_path = param.get("last_file_path").toString();
        if ("U".equals(param.get("form_type").toString())) {
            params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + base_file_path.substring(0, base_file_path.length() - 1));
        } else {
            params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_dir").toString());
        }

        params.put("target_file_name", StringUtil.changeFileName(param.get("base_file_nm").toString(), "_set_col"));
        params.put("base_file_name", param.get("base_file_nm_set_range_row").toString());

        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        params.put("preproc_trgt_col", MetaRelateUtil.parseJSONStringToArray(param.get("preproc_trgt_col").toString()));

        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorMakeBaseDataSetRangeCol/", params));
    }

    public ResponseEntity<?> getDataSetColumnListInfo(Map<String, Object> param) {
        Map<String, Object> params = new HashMap<String, Object>();
        String base_file_path = param.get("base_file_path").toString();
        if ("U".equals(param.get("form_type").toString())) {
            params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + base_file_path.substring(0, base_file_path.length() - 1));
        } else {
            params.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + base_file_path);
        }


        params.put("file_name", param.get("base_file_nm").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());

        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorDatasetInfo/", params));
    }

    public ResponseEntity<?> makeValidateSet(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorDatasetVerify/", params));
    }

    public ResponseEntity<?> makeOutlierSet(Map<String, Object> params, String type) {
        switch (type) {
            case "standard":
                return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorOutlierStandardDeviation/", params));
            case "kmean":
                return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorOutlierKMeans/", params));
            case "dbscan":
                return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorOutlierDBscan/", params));
            case "autoencoder":
            case "AutoEncoder":
            case "Auto Encoder":
            case "auto encoder":
                return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorDataAEGenerater/", params));
            default:
                throw new RuntimeException();
        }
    }

    public ResponseEntity<?> makeInterpolateSet(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorDatasetInterpolate/", params));
    }

    public ResponseEntity<?> makeInterpolateDecisionSet(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/example/processorDecisionTree/", params));
    }

    public ResponseEntity<?> makeInterpolateModelDecisionSet(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/example/processorDecisionTree_model/", params));
    }

    public ResponseEntity<?> makeInterpolateSetRF(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newaugment/augmentCreate_randomForest/", params));
    }

    public ResponseEntity<?> makeInterpolateSetBrits(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newaugment/augmentCreate_brits_ori/", params));
    }

    public ResponseEntity<?> makeInterpolateSetNaomi(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newaugment/augmentCreate_naomi/", params));
    }

    public ResponseEntity<?> makeResampleSet(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorDatasetResample/", params));
    }

    public ResponseEntity<?> makeUnitSet(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorDatasetUnitConverter/", params));
    }

    public ResponseEntity<?> getIndexColumnTimeCheck(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorDateTimeCheck/", params));
    }

    public ResponseEntity<?> getResourceDts(Map<String, Object> params) throws UnsupportedEncodingException {
        return ResponseEntity.ok(apiService.requestMetaDataApi("/meta/api/v1/resource/dts", params));
    }

    public ResponseEntity<?> getResourceObject(Map<String, Object> params) throws UnsupportedEncodingException {
        return ResponseEntity.ok(apiService.requestMetaDataApi("/meta/api/v1/resource/objects", params));
    }

    public ResponseEntity<?> getResourceObjectDetailFull(Map<String, Object> params) throws UnsupportedEncodingException {
        return ResponseEntity.ok(apiService.requestMetaDataApi("/meta/api/v1/resource/full-objects/" + params.get("object_id") + "?arrayDataLimitYn=Y&arrayDataLimit=50", params));
    }

    public ResponseEntity<?> getResourceObjectDataMetaFirst(Map<String, Object> params) {
        String digital_twins = params.get("digital_twins").toString();
        String digital_objects = params.get("digital_objects").toString();
        String count = params.get("target_row_count").toString();
        String limit = params.get("limit").toString();

        String target_start_date = params.get("target_start_date") != null ? params.get("target_start_date").toString() : null;
        String target_end_date = params.get("target_end_date") != null ? params.get("target_end_date").toString() : null;

        String count_range = null;
        String date_range = null;
        /**
         * http://{IP}:{PORT}/fedit/v1/digital-twins/KR-02-D10000-20240001/digital-objects/KR-104710-0002/data?count=1000
         * 해당 부분은 날짜가 없을 때 로직입니다.
         * */
        if (target_start_date != null && target_end_date != null) {
            /*
             * 조회시 불러오기 기준값으로 불러온다.
             * 날짜가 존재할 때
             * */
            String fromDate = TimeUtil.parseToYYYYMMDDHHMMSSFromZoneDateTime(TimeUtil.parseToYYYYMMDDHHMMSS(false, target_start_date));
            String toDate = TimeUtil.parseToYYYYMMDDHHMMSSFromZoneDateTime(TimeUtil.parseToYYYYMMDDHHMMSS(true, target_end_date));
            date_range = "from=" + fromDate + "&to=" + toDate;
        }
        if (Objects.equals(digital_twins, "KR-02-C20000-20240001") && Objects.equals(digital_objects, "KR-104111-0001")) {
            /**
             * 교통 관련 데이터는 예외 처리
             * */
            count_range = "count=10";
        } else {
            if (!Objects.equals(count, "0")) {
                if (Integer.parseInt(limit) < Integer.parseInt(count)) {
                    count_range = "count=" + limit;
                } else {
                    count_range = "count=" + count;
                }
            } else {
                if (!date_range.isEmpty()) {
                    count_range = "count=" + limit;
                } else {
                    count_range = "count=" + limit;
                }
            }
        }

        // API URL 구성
        StringBuilder apiUrlBuilder = new StringBuilder();
        apiUrlBuilder.append("/fedit/v1/digital-twins/");
        apiUrlBuilder.append(digital_twins);
        apiUrlBuilder.append("/digital-objects/");
        apiUrlBuilder.append(digital_objects);
        apiUrlBuilder.append("/data");

        // 쿼리 매개변수 추가
        boolean hasParams = false;
        if (!count_range.isEmpty()) {
            apiUrlBuilder.append("?");
            apiUrlBuilder.append(count_range);
            hasParams = true;
        }
        if (date_range != null) {
            if (hasParams) {
                apiUrlBuilder.append("&");
            } else {
                apiUrlBuilder.append("?");
            }
            apiUrlBuilder.append(date_range);
        }
        return ResponseEntity.ok(apiService.requestDataApi(apiUrlBuilder.toString(), new HashMap<>()));
    }

    public ResponseEntity<?> getResourceObjectDataSet(Map<String, Object> params, boolean isLimit) {
        String digital_twins = params.get("digital_twins").toString();
        String digital_objects = params.get("digital_objects").toString();
        String from_date = params.get("from_date") != null ? params.get("from_date").toString() : null;
        String to_date = params.get("to_date") != null ? params.get("to_date").toString() : null;
        String data_max_limit_cnt = params.get("data_max_limit_cnt") != null ? params.get("data_max_limit_cnt").toString() : null;
        String count_range = null;
        if (isLimit && data_max_limit_cnt != null) {
            // 데이터 가져올 한계치 정할 때
            count_range = "count=" + data_max_limit_cnt;
        }
        if (to_date != null && from_date != null) {
            return ResponseEntity.ok(apiService.requestDataApi("/fedit/v1/digital-twins/" + digital_twins + "/digital-objects/" + digital_objects + "/data?from=" + from_date + "&to=" + to_date + (count_range != null ? "&" + count_range : ""), params));
        } else {
            return ResponseEntity.ok(apiService.requestDataApi("/fedit/v1/digital-twins/" + digital_twins + "/digital-objects/" + digital_objects + "/data" + (count_range != null ? "?" + count_range : ""), params));
        }
    }

    public HashMap<String, Object> makeDataNormalize(JsonNode infoNode) {
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
            for (String header : headers) {
                data.add(jsonObject.getJSONArray(header).get(i).toString());
            }
            datasList.add(data);
        }
        result.put("headers", headers);
        result.put("datas", datasList);
        return result;
    }

    public HashMap<String, Object> makeDataNormalizeKMean(JsonNode infoNode, String excludeGroup) {
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
                    row.add(node.get(fields.next()).asText());
                }
                rows.add(row);
            }
        }
        result.put("headers", headers);
        result.put("datas", rows);
        return result;
    }

    public HashMap<String, Object> makeDataNormalizeDBSCAN(JsonNode infoNode) {
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
                    row.add(node.get(fields.next()).asText());
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

    public TimeUnit reSampleTimeDivider(String dateKey, List<String> headers, List<List<String>> datas) {
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
        return unit;
    }

    /*
     * LSTM, GRU
     * */
    public ResponseEntity<?> makeContinuousAugmentRepeatInterpolationSet(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newaugment/augmentCreate_interpolation/", params));
    }

    /*DEEP AR*/
    public ResponseEntity<?> makeContinuousDeepARAugmentRepeatInterpolationSet(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newaugment/augmentCreate_deepAR_interpolation/", params));
    }

    /*N-Beats*/
    public ResponseEntity<?> makeContinuousNBeatsAugmentRepeatInterpolationSet(Map<String, Object> params) {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newaugment/augmentCreate_nbeats_interpolation/", params));
    }

    public ResponseEntity<?> correlation(Map<String, Object> params, String type) {
        switch (type) {
            case "standard":
                return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorOutlierStandardDeviation/", params));
            case "kmean":
                return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorOutlierKMeans/", params));
            case "dbscan":
                return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorOutlierDBscan/", params));
            case "autoencoder":
            case "AutoEncoder":
            case "Auto Encoder":
            case "auto encoder":
                return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorDataAEGenerater/", params));
            default:
                return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorDatasetCorrelation/", params));
        }
    }
}
