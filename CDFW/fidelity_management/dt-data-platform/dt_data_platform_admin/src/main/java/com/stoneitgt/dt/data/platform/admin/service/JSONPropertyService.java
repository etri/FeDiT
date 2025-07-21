package com.stoneitgt.dt.data.platform.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.domain.DTModelJsonProperty;
import com.stoneitgt.dt.data.platform.domain.DTModelJsonPropertySubSet;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Data
@Slf4j
public class JSONPropertyService {

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
        JSONObject jsonObject = new JSONObject(json);
        JSONArray preprocPropertyInfo = jsonObject.getJSONArray("preproc_property_info");
        JSONObject firstElement = preprocPropertyInfo.getJSONObject(0); // Assuming only one element in preproc_property_info
        return firstElement.optString(key, null);
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
        return dtModelJsonPropertySubSets.get(0);
    }
}
