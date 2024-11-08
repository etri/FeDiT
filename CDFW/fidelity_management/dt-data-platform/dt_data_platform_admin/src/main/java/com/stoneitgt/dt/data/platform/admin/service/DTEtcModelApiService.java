package com.stoneitgt.dt.data.platform.admin.service;

import java.util.*;

import com.stoneitgt.dt.data.platform.util.TimeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import com.stoneitgt.dt.data.platform.util.MetaRelateUtil;
import com.stoneitgt.dt.data.platform.util.StringUtil;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DTEtcModelApiService extends BaseService {

    @Autowired
    private APIService apiService;

    //사용자 업로드 파일로 프로세스 태우기
    public ResponseEntity<?> makeUserUploadBaseDataFile(Map<String, Object> param) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("user_tmp_key").toString());
        params.put("file_name", param.get("file_name").toString());
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorMakeUserUploadBaseDataSet/", params));
    }

    //모달 팝업에서 초기 가져오는 갯수만 제한을 둘 조건 없는 데이터
    public ResponseEntity<?> makeBaseDataFile(Map<String, Object> param) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("user_tmp_key").toString());
        params.put("file_name", param.get("user_tmp_key").toString() + "_origin" + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv");
        params.put("data", param.get("data"));
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorMakeBaseDataSet/", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> checkIndexTimeColumn(Map<String, Object> param) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
        params.put("base_file_name", param.get("base_file_nm").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorCheckIndexTimeColumn/", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeBaseDataSetRangeRow(Map<String, Object> param) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + param.get("base_file_path").toString());
        params.put("target_file_name", StringUtil.changeFileName(param.get("base_file_nm").toString(), "_set_row"));
        params.put("base_file_name", param.get("base_file_nm").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        params.put("target_start_date", param.get("target_start_date").toString());
        params.put("target_end_date", param.get("target_end_date").toString());
        params.put("target_row_count", param.get("target_row_count").toString());
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorMakeBaseDataSetRangeRow/", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> makeBaseDataSetRangeCol(Map<String, Object> param) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        String base_file_path = param.get("last_file_path").toString();
        if ("U".equals(param.get("form_type").toString())) {
            params.put("file_path", systemProperties.getDtEtcMetaFilePath() + base_file_path.substring(0, base_file_path.length() - 1));
        } else {
            params.put("file_path", systemProperties.getDtEtcMetaFilePath() + "/tmp/" + param.get("base_dir").toString());
        }
        params.put("target_file_name", StringUtil.changeFileName(param.get("base_file_nm").toString(), "_set_col"));
        params.put("base_file_name", param.get("base_file_nm_set_range_row").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        params.put("preproc_trgt_col", MetaRelateUtil.parseJSONStringToArray(param.get("preproc_trgt_col").toString()));
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorMakeBaseDataSetRangeCol/", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getDataSetColumnListInfo(Map<String, Object> param) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        String base_file_path = param.get("base_file_path").toString();
        if ("U".equals(param.get("form_type").toString())) {
            params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + base_file_path.substring(0, base_file_path.length() - 1));
        } else {
            params.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + base_file_path);
        }
        params.put("file_name", param.get("base_file_nm").toString());
        params.put("index_trgt_col", param.get("index_trgt_col").toString());
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorDatasetInfo/", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getIndexColumnTimeCheck(Map<String, Object> params) throws Exception {
        return ResponseEntity.ok(apiService.requestPythonApi("/dt/newpreproc/processorDateTimeCheck/", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getResourceDts(Map<String, Object> params) throws Exception {
        return ResponseEntity.ok(apiService.requestMetaDataApi("/meta/api/v1/resource/dts", params));
    }

    //데이터 선택 화면에서 인덱스컬럼과 시간 또는 갯수를 지정해서 원본 csv 다음 csv를 생성 후 로드
    public ResponseEntity<?> getResourceObject(Map<String, Object> params) throws Exception {
        return ResponseEntity.ok(apiService.requestMetaDataApi("/meta/api/v1/resource/objects", params));
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
        if (!date_range.isEmpty()) {
            if (hasParams) {
                apiUrlBuilder.append("&");
            } else {
                apiUrlBuilder.append("?");
            }
            apiUrlBuilder.append(date_range);
        }

        String apiUrl = apiUrlBuilder.toString();
        return ResponseEntity.ok(apiService.requestDataApi(apiUrl, params));
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
