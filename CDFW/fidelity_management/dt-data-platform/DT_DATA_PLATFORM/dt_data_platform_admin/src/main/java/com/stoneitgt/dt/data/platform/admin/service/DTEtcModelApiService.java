package com.stoneitgt.dt.data.platform.admin.service;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URLEncoder;
import java.util.*;

import com.stoneitgt.dt.data.platform.util.TimeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.MetaRelateUtil;
import com.stoneitgt.dt.data.platform.util.StringUtil;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DTEtcModelApiService {

    @Autowired
    private BaseSystemProperties systemproperties;

    public String requestPythonApi(String url, Map<String, Object> params) {
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
        params.put("file_path", systemproperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("user_tmp_key").toString());
        params.put("file_name", param.get("file_name").toString());

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }


    //모달 팝업에서 초기 가져오는 갯수만 제한을 둘 조건 없는 데이터
    public ResponseEntity<?> makeBaseDataFile(Map<String, Object> param) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorMakeBaseDataSet/";

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemproperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("user_tmp_key").toString());
        params.put("file_name", param.get("user_tmp_key").toString() + "_origin" + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv");
        params.put("data", param.get("data"));


        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> checkIndexTimeColumn(Map<String, Object> param) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorCheckIndexTimeColumn/";

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemproperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
        params.put("base_file_name", param.get("base_file_nm").toString());
        log.info("processorCheckIndexTimeColumn::::" + params);
        params.put("index_trgt_col", param.get("index_trgt_col").toString());

        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeBaseDataSetRangeRow(Map<String, Object> param) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorMakeBaseDataSetRangeRow/";

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemproperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
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
            params.put("file_path", systemproperties.getDtEtcMetaFilePath().replace("\\", "/") + base_file_path.substring(0, base_file_path.length() - 1));
        } else {
            params.put("file_path", systemproperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_dir").toString());
        }

        params.put("target_file_name", StringUtil.changeFileName(param.get("base_file_nm").toString(), "_set_col"));
        params.put("base_file_name", param.get("base_file_nm_set_range_row").toString());

        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        params.put("preproc_trgt_col", MetaRelateUtil.parseJSONStringToArray(param.get("preproc_trgt_col").toString()));
        log.info("makeBaseDataSetRangeCol -> {}", params);
        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getDataSetColumnListInfo(Map<String, Object> param) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorDatasetInfo/";

        Map<String, Object> params = new HashMap<String, Object>();
        String base_file_path = param.get("base_file_path").toString();
        if ("U".equals(param.get("form_type").toString())) {
            params.put("file_path", systemproperties.getDtEtcMetaFilePath().replace("\\", "/") + base_file_path.substring(0, base_file_path.length() - 1));
        } else {
            params.put("file_path", systemproperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + base_file_path);
        }

        params.put("file_name", param.get("base_file_nm").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        log.info("getDataSetColumnListInfo -> {}", params);
        return ResponseEntity.ok(requestPythonApi(apiUrl, params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getIndexColumnTimeCheck(Map<String, Object> params) throws Exception {
        String apiUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorDateTimeCheck/";
        log.info("getIndexColumnTimeCheck -> {}", params);
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
        String apiUrl = systemproperties.getDtMetaApiUrl() + "/meta/api/v1/resource/full-objects/" + params.get("object_id") + "?arrayDataLimitYn=Y&arrayDataLimit=10";
        return ResponseEntity.ok(requestN2MApiGET(apiUrl, params));
    }

    public ResponseEntity<?> getResourceObjectData(Map<String, Object> params) throws Exception {
        String digital_twins = params.get("twin_id").toString();
        String digital_objects = params.get("object_id").toString();

        String apiUrl = systemproperties.getDtKetiApiUrl() + "/fedit/v1/digital-twins/" + digital_twins + "/digital-objects/" + digital_objects + "/data";
        return ResponseEntity.ok(requestKETIApiGETSample(apiUrl, params));
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
        } else {
            /**
             * 초기 불러오기 아무것도 설정 없음 기본값으로 불러온다.
             * */
            date_range = "";
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
        if (!date_range.isEmpty()) {
            if (hasParams) {
                apiUrlBuilder.append("&");
            } else {
                apiUrlBuilder.append("?");
            }
            apiUrlBuilder.append(date_range);
        }

        String apiUrl = apiUrlBuilder.toString();
        log.info("getResourceObjectDataMetaFirst apiUrl -> " + apiUrl);
        return ResponseEntity.ok(requestKETIApiGETSample(apiUrl, params));
    }
}
