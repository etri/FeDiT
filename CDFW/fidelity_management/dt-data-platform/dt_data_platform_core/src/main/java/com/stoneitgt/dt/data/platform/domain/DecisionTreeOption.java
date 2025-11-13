package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@Data
public class DecisionTreeOption {
    private String file_path;
    private String file_name;
    private String prev_file_name;
    private String target_file_name;
    private String index_column;
    private ArrayList<String> outputs;
    private String model_path;
    private String feature;
    private String set_order;
    private String isCreate;

    public DecisionTreeOption() {

    }

    // 모든 필드를 초기화하는 생성자
    public DecisionTreeOption(String file_path, String file_name, String prev_file_name, String target_file_name,
                              String index_column, ArrayList<String> outputs, String model_path, String feature,
                              String set_order, String isCreate) {
        this.file_path = file_path;
        this.file_name = file_name;
        this.prev_file_name = prev_file_name;
        this.target_file_name = target_file_name;
        this.index_column = index_column;
        this.outputs = outputs;
        this.model_path = model_path;
        this.feature = feature;
        this.set_order = set_order;
        this.isCreate = isCreate;
    }

    public Map<String, Object> decisionTreeSetParam() {
        Map<String, Object> map = new HashMap<>();
        map.put("file_path", file_path);
        map.put("file_name", file_name);
        map.put("prev_file_name", prev_file_name);
        map.put("target_file_name", target_file_name);
        map.put("index_column", index_column);
        map.put("outputs", outputs);
        map.put("model_path", model_path);
        map.put("feature", feature);
        map.put("set_order", set_order);
        map.put("isCreate", isCreate);
        return map;
    }
}
