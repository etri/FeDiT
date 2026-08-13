package com.stoneitgt.dt.data.platform.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.domain.DTModelJsonHyperParamSub;
import com.stoneitgt.dt.data.platform.domain.DTModelJsonProperty;
import com.stoneitgt.dt.data.platform.domain.DTModelJsonPropertySubSet;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Data
@Slf4j
public class JSONPropertyService {

    /*public static void main(String[] args) {
        JSONPropertyService jsonPropertyService = new JSONPropertyService();
        DTModelJsonProperty dtModelJsonProperty = jsonPropertyService.propertyParsingToObject("{\"preproc_property_info\":[{\"model_derpn\":\"TEST\",\"preproc_property\":[{\"preproc_type\":\"validate\",\"preproc_order\":1,\"preproc_set\":[]},{\"preproc_type\":\"outlier\",\"preproc_order\":2,\"preproc_set\":[]},{\"preproc_type\":\"missing\",\"preproc_order\":3,\"preproc_set\":[]},{\"preproc_type\":\"interval\",\"preproc_order\":4,\"preproc_set\":[{\"validate_data\":[],\"missing_data\":[],\"resmpl_tp_nm\":\"분\",\"resmpl_removed_data\":[],\"resmpl_added_data\":[],\"outlier_data\":[],\"set_order\":1,\"resmpl_count\":10327,\"outlier_count\":0,\"resmpl_removed_count\":0,\"resmpl_tp\":\"T\",\"interpl_window_size\":0,\"row_count\":\"10000\",\"missing_count\":0,\"trgt_file_nm\":\"admin1743756334123_resample_1743756395002.csv\",\"validate_count\":0,\"interpl_etc_model_seq\":0,\"resmpl_added_count\":328,\"resmpl_intvl_value\":\"1\"}]},{\"preproc_type\":\"unit\",\"preproc_order\":5,\"preproc_set\":[]}],\"model_create\":\"Y\",\"loginUserSeq\":0,\"model_property\":[{\"algorithm_seq\":1,\"independent\":[\"secondary_value\",\"quarternary_value\",\"third_value\"],\"hyperparam\":{\"meterics_nm\":\"MSE\",\"window_size\":\"50\",\"data_size\":\"100\",\"loss\":\"HUB\",\"batch_size\":\"16\",\"optimizer\":\"ADAM\",\"optimizer_nm\":\"ADAM\",\"test_size\":\"0.2\",\"meterics\":\"MSE\",\"epochs\":\"5\",\"loss_nm\":\"Huber\",\"optimizer_lr\":\"0.0005\"},\"dependent\":[\"primary_value\"],\"algorithm\":\"LSTM\"}],\"target_row_count\":\"10000\",\"rls_yn\":\"N\",\"last_step_preproc_order\":4,\"twin_id\":\"KR-02-K10000-20240001\",\"index_trgt_col\":\"measurement_date\",\"model_nm\":\"TEST\",\"data_use_tp\":\"M\",\"base_file_nm_set_range_row\":\"admin1743756334123_origin_20250404174534_set_row.csv\",\"base_file_nm\":\"admin1743756334123_origin_20250404174534.csv\",\"base_file_nm_set_range_col\":\"admin1743756334123_origin_20250404174534_set_col.csv\",\"base_dir\":\"admin1743756334123\",\"last_step_preproc_file_nm\":\"admin1743756334123_resample_1743756395002.csv\",\"twin_obj_id\":\"KR-104710-0003\",\"preproc_trgt_col\":[\"secondary_value\",\"device_id\",\"primary_value\",\"measurement_id\",\"min_adjustment\",\"quarternary_value\",\"third_value\"]}]}");
        log.info("dtModelJsonProperty -> {}", dtModelJsonProperty.getPreproc_property_info().get(0).getModel_property().get(0).getHyperparam().getData_size());
    }*/

    public Map<String, Object> propertyParsingMap(String propertyJson) throws IOException {
        LinkedHashMap<String, Object> infoMap = new LinkedHashMap<>();
        String twin_id = getFirstNodeProcInfo("twin_id", propertyJson);
        String base_dir = getFirstNodeProcInfo("base_dir", propertyJson);
        String base_file_nm = getFirstNodeProcInfo("base_file_nm", propertyJson);
        String base_file_nm_set_range_row = getFirstNodeProcInfo("base_file_nm_set_range_row", propertyJson);
        String base_file_nm_set_range_col = getFirstNodeProcInfo("base_file_nm_set_range_col", propertyJson);
        String index_trgt_col = getFirstNodeProcInfo("index_trgt_col", propertyJson);
        String target_start_date = getFirstNodeProcInfo("target_start_date", propertyJson);
        String target_end_date = getFirstNodeProcInfo("target_end_date", propertyJson);
        String target_row_count = getFirstNodeProcInfo("target_row_count", propertyJson);
        String model_nm = getFirstNodeProcInfo("target_row_count", propertyJson);
        String preproc_trgt_col = getFirstNodeProcInfo("preproc_trgt_col", propertyJson);

        infoMap.put("twin_id", twin_id);
        infoMap.put("base_dir", base_dir);
        infoMap.put("base_file_nm", base_file_nm);
        infoMap.put("base_file_nm_set_range_row", base_file_nm_set_range_row);
        infoMap.put("base_file_nm_set_range_col", base_file_nm_set_range_col);
        infoMap.put("index_trgt_col", index_trgt_col);
        infoMap.put("target_start_date", target_start_date);
        infoMap.put("target_end_date", target_end_date);
        infoMap.put("target_row_count", target_row_count);
        infoMap.put("model_nm", model_nm);
        infoMap.put("preproc_trgt_col", preproc_trgt_col);
        return infoMap;
    }

    public String getFirstNodeProcInfo(String key, String json) {
        try {
            JsonNode jsonObject = new ObjectMapper().readTree(json);
            JsonNode preprocPropertyInfo = jsonObject.get("preproc_property_info");
            JsonNode firstElement = preprocPropertyInfo.get(0); // Assuming only one element in preproc_property_info
            // optString(key, null) 과 동일하게 키가 없거나 null 이면 null 을 반환한다
            JsonNode value = firstElement.get(key);
            if (value == null || value.isNull()) {
                return null;
            }
            // org.json optString 은 배열·객체를 JSON 원문 문자열로 반환했다.
            // Jackson asText() 는 비(非)스칼라 노드에 "" 를 주므로 toString() 으로 분기한다.
            // (preproc_trgt_col 이 배열이라 이 분기가 없으면 선택 컬럼이 빈 배열로 유실된다)
            return value.isValueNode() ? value.asText() : value.toString();
        } catch (IOException e) {
            log.error("getFirstNodeProcInfo 파싱 실패 -> key: {}", key, e);
            return null;
        }
    }

    public DTModelJsonProperty propertyParsingToObject(String propertyJson) {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            // JSON 문자열을 ErrorLog 객체로 변환
            return objectMapper.readValue(propertyJson, DTModelJsonProperty.class);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public DTModelJsonPropertySubSet getIntervalProperty(DTModelJsonProperty property) {
        List<DTModelJsonPropertySubSet> dtModelJsonPropertySubSets = property.getPreproc_property_info().get(0).getPreproc_property().get(3).getPreproc_set();
        if(dtModelJsonPropertySubSets.size() > 0){
            return dtModelJsonPropertySubSets.get(0);
        }
        return null;
    }

    public DTModelJsonHyperParamSub getModelProperty(DTModelJsonProperty property) {
        List<DTModelJsonHyperParamSub> modelProperties = property.getPreproc_property_info().get(0).getModel_property();
        return  modelProperties.get(0);
    }
}
