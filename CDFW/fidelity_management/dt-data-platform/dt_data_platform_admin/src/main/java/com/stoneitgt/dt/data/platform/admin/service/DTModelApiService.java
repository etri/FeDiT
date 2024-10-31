package com.stoneitgt.dt.data.platform.admin.service;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URLEncoder;
import java.util.*;

import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.*;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DTModelApiService {

    @Autowired
    private BaseSystemProperties systemproperties;

    public String requestPythonApi(String url, Map<String, Object> params) {
        RestTemplate restTemplate = new RestTemplate();

        String contentType = "application/json";
        String authKey = "Token " + systemproperties.getDtApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("Authorization", authKey);

        log.info("requestPythonApi url -> {}", url);
        log.info("requestPythonApi params -> {}", params);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(params, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        return response.getBody();
    }

    public String requestN2MApiGET(String url, Map<String, Object> params) throws UnsupportedEncodingException {
        Map<String, Object> result = new HashMap<String, Object>();

        String contentType = "application/json";
        String authKey = "Bearer " + systemproperties.getDtN2mKey();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("Authorization", authKey);
        headers.add("accept", "*/*");

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            builder.queryParam(key, value);
        }
        URI uri = builder.build().expand(params).encode().toUri();
        HttpEntity<?> entity = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();

        log.info("requestN2MApiGET uri -> {}", uri);

        ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

        String responseBody = response.getBody();
        result.put("responseBody", responseBody);

        return responseBody;
    }


    public String requestKETIApiGET(String url, Map<String, Object> params) throws UnsupportedEncodingException {
        Map<String, Object> result = new HashMap<String, Object>();

        String contentType = "application/json";

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("accept", "*/*");

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (value instanceof String) {
                // URL 인코딩하여 추가
                builder.queryParam(key, URLEncoder.encode((String) value, "UTF-8"));
            } else {
                builder.queryParam(key, value);
            }
        }

        URI uri = builder.build().toUri();

        // Create HTTP Entity with Headers
        HttpEntity<?> entity = new HttpEntity<>(headers);

        // Create RestTemplate instance
        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

        String responseBody = response.getBody();
        result.put("responseBody", responseBody);
        return responseBody;
    }


    public String requestKETIApiGETSample(String url, Map<String, Object> params) throws UnsupportedEncodingException {
        Map<String, Object> result = new HashMap<String, Object>();

        String contentType = "application/json";

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("accept", "*/*");

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (value instanceof String) {
                // URL 인코딩하여 추가
                builder.queryParam(key, URLEncoder.encode((String) value, "UTF-8"));
            } else {
                builder.queryParam(key, value);
            }
        }

        URI uri = builder.build().toUri();

        // Create HTTP Entity with Headers
        HttpEntity<?> entity = new HttpEntity<>(headers);

        // Create RestTemplate instance
        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

        String responseBody = response.getBody();
        result.put("responseBody", responseBody);

        return responseBody;
    }


    //사용자 업로드 파일로 프로세스 태우기
    public ResponseEntity<?> makeUserUploadBaseDataFile(Map<String, Object> param) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorMakeUserUploadBaseDataSet/";

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemproperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("user_tmp_key").toString());
        params.put("file_name", param.get("file_name").toString());

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }


    //모달 팝업에서 초기 가져오는 갯수만 제한을 둘 조건 없는 데이터
    public ResponseEntity<?> makeBaseDataFile(Map<String, Object> param) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorMakeBaseDataSet/";

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemproperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("user_tmp_key").toString());
        params.put("file_name", param.get("user_tmp_key").toString() + "_origin" + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv");
        params.put("data", param.get("data"));


        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //시뮬레이션 기본 데이터
    public ResponseEntity<?> makeBaseSimulationDataFile(Map<String, Object> param) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorMakeBaseDataSet/";

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", param.get("file_path"));
        params.put("file_name", param.get("file_name"));
        params.put("data", param.get("data"));
        params.put("index_trgt_col", param.get("index_trgt_col"));

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }


    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> checkIndexTimeColumn(Map<String, Object> param) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorCheckIndexTimeColumn/";

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemproperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
        params.put("base_file_name", param.get("base_file_nm").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeBaseDataSetRangeRow(Map<String, Object> param) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorMakeBaseDataSetRangeRow/";

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemproperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
        params.put("target_file_name", StringUtil.changeFileName(param.get("base_file_nm").toString(), "_set_row"));
        params.put("base_file_name", param.get("base_file_nm").toString());

        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        params.put("target_start_date", param.get("target_start_date").toString());
        params.put("target_end_date", param.get("target_end_date").toString());
        params.put("target_row_count", param.get("target_row_count").toString());

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeBaseDataSetRangeCol(Map<String, Object> param) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorMakeBaseDataSetRangeCol/";

        Map<String, Object> params = new HashMap<String, Object>();
        String base_file_path = param.get("last_file_path").toString();
        if ("U".equals(param.get("form_type").toString())) {
            params.put("file_path", systemproperties.getDtMetaFilePath().replace("\\", "/") + base_file_path.substring(0, base_file_path.length() - 1));
        } else {
            params.put("file_path", systemproperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_dir").toString());
        }

        params.put("target_file_name", StringUtil.changeFileName(param.get("base_file_nm").toString(), "_set_col"));
        params.put("base_file_name", param.get("base_file_nm_set_range_row").toString());

        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        params.put("preproc_trgt_col", MetaRelateUtil.parseJSONStringToArray(param.get("preproc_trgt_col").toString()));

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getDataSetColumnListInfo(Map<String, Object> param) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorDatasetInfo/";

        Map<String, Object> params = new HashMap<String, Object>();
        String base_file_path = param.get("base_file_path").toString();
        if ("U".equals(param.get("form_type").toString())) {
            params.put("file_path", systemproperties.getDtMetaFilePath().replace("\\", "/") + base_file_path.substring(0, base_file_path.length() - 1));
        } else {
            params.put("file_path", systemproperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + base_file_path);
        }


        params.put("file_name", param.get("base_file_nm").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }


    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeValidateSet(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorDatasetVerify/";
        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }


    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeOutlierSet(Map<String, Object> params, String type) throws Exception {
        log.info("type:::" + type);
        log.info("params:::" + params);
        String apiUrl = "";
        if ("standard".equals(type)) {
            apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorOutlierStandardDeviation/";
        }

        if ("kmean".equals(type)) {
            apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorOutlierKMeans/";
            log.info("type:::" + apiUrl);
        }

        if ("dbscan".equals(type)) {
            apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorOutlierDBscan/";
        }

        if ("autoencoder".equals(type)
                || "autoencoder".equalsIgnoreCase(type)
                || "auto encoder".equals(type)
                || "auto encoder".equalsIgnoreCase(type)) {
            apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorDataAEGenerater/";
        }


        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }


    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeInterpolateSet(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorDatasetInterpolate/";
        //FileSystems.getDefault().getSeparator()
        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    public ResponseEntity<?> makeInterpolateDecisionSet(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/example/processorDecisionTree/";
        log.info("apiUrl -> {}", apiUrl);
        //FileSystems.getDefault().getSeparator()

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    public ResponseEntity<?> makeInterpolateModelDecisionSet(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/example/processorDecisionTree_model/";
        log.info("apiUrl -> {}", apiUrl);
        //FileSystems.getDefault().getSeparator()

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeInterpolateSetRF(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newaugment/augmentCreate_randomForest/";
        //FileSystems.getDefault().getSeparator()
        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeInterpolateSetBrits(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newaugment/augmentCreate_brits_ori/";
        //FileSystems.getDefault().getSeparator()
        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeResampleSet(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorDatasetResample/";
        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeUnitSet(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorDatasetUnitConverter/";
        //FileSystems.getDefault().getSeparator()

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getIndexColumnTimeCheck(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorDateTimeCheck/";
        //FileSystems.getDefault().getSeparator()

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    public String requestDjangoApi(String url, Map<String, Object> params, int modelSeq) {
        Map<String, Object> result = new HashMap<String, Object>();

        RestTemplate restTemplate = new RestTemplate();

        String contentType = "application/json";
        String authKey = "Token " + systemproperties.getDtApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("Authorization", authKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(params, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        String responseBody = response.getBody();
        result.put("responseBody", responseBody);

        return responseBody;
    }


    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getResourceDts(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtMetaApiUrl() + "/meta/api/v1/resource/dts";
        return ResponseEntity.ok(requestN2MApiGET(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getResourceObject(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtMetaApiUrl() + "/meta/api/v1/resource/objects";
        return ResponseEntity.ok(requestN2MApiGET(apiUrl, params));
    }

    public ResponseEntity<?> getResourceObjectDetailFull(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtMetaApiUrl() + "/meta/api/v1/resource/full-objects/" + params.get("object_id") + "?arrayDataLimitYn=Y&arrayDataLimit=50";
        log.info("getResourceObjectDetailFull apiUrl -> {}", apiUrl);
        return ResponseEntity.ok(requestN2MApiGET(apiUrl, params));
    }

    public ResponseEntity<?> getResourceObjectDataMetaFirst(Map<String, Object> params) throws Exception {
        log.info("params:::" + params);
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
			/*if (Integer.parseInt(count) <= Integer.parseInt(limit)) {
                count_range = "?count=" + count;
            } else {
                count_range = "?count=" + limit;
            }*/
        }

        // API URL 구성
        StringBuilder apiUrlBuilder = new StringBuilder();
        apiUrlBuilder.append(systemproperties.getDtKetiApiUrl() + "/fedit/v1/digital-twins/");
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

        String apiUrl = apiUrlBuilder.toString();

        log.info("getResourceObjectDataMetaFirst apiUrl -> " + apiUrl);
        //return ResponseEntity.ok(requestKETIApiGET(apiUrl, params));
        return ResponseEntity.ok(requestKETIApiGETSample(apiUrl, params));
    }

    public ResponseEntity<?> getResourceObjectDataSet(Map<String, Object> params, boolean isLimit) throws Exception {
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
        String apiUrl = null;
        if (to_date != null && from_date != null) {
            apiUrl = systemproperties.getDtKetiApiUrl() + "/fedit/v1/digital-twins/" + digital_twins + "/digital-objects/" + digital_objects + "/data?from=" + from_date + "&to=" + to_date + (count_range != null ? "&" + count_range : "");
        } else {
            apiUrl = systemproperties.getDtKetiApiUrl() + "/fedit/v1/digital-twins/" + digital_twins + "/digital-objects/" + digital_objects + "/data" + (count_range != null ? "?" + count_range : "");
        }
        log.info("getResourceObjectDataSet apiUrl -> " + apiUrl);
        return ResponseEntity.ok(requestKETIApiGET(apiUrl, params));
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
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newaugment/augmentCreate_interpolation/";
        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    /*DEEP AR*/
    public ResponseEntity<?> makeContinuousDeepARAugmentRepeatInterpolationSet(Map<String, Object> params) {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newaugment/augmentCreate_deepAR_interpolation/";
        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    /*N-Beats*/
    public ResponseEntity<?> makeContinuousNBeatsAugmentRepeatInterpolationSet(Map<String, Object> params) {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newaugment/augmentCreate_nbeats_interpolation/";
        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }
}
