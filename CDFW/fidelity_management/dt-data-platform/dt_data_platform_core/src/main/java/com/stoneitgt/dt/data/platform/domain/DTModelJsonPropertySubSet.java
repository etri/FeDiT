package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

import java.util.List;

@Data
public class DTModelJsonPropertySubSet {

    private int set_order;
    private String trgt_file_nm;
    private String trgt_col;
    private String vrfc_tp;
    private String vrfc_tp_nm;
    private String vrfc_sub_tp;
    private String vrfc_sub_tp_nm;
    private String vrfc_clear_tp;
    private String vrfc_clear_tp_nm;
    private String rule1;
    private String rule2;
    private String rule3;
    private String rule4;
    private String outlier_tp;
    private String freq;
    private String n_clusters;
    private String clusters_group;
    private String eps;
    private String p_value;
    private String min_samples;
    private String n_clusters_lable;
    private String n_count;
    private String interpl_tp;
    private String resmpl_tp;
    private String resmpl_tp_nm;
    private String resmpl_intvl_value;
    private String unit_tp;
    private String unit_tp_nm;
    private String unit_cd_1;
    private String unit_cd_1_nm;
    private String unit_cd_2;
    private String unit_cd_2_nm;

    private String window_size;
    private String threshold;
    private String etc_model_seq;

    private String row_count;

    private int validate_count;
    private List<List<String>> validate_data;

    private int outlier_count;
    private List<List<String>> outlier_data;

    private int missing_count;
    private List<List<String>> missing_data;

    private int resmpl_count;
    private int resmpl_removed_count;
    private int resmpl_added_count;
    private List<List<String>> resmpl_removed_data;
    private List<List<String>> resmpl_added_data;

    private String interpl_feature;
    private List<String> interpl_outputs;
    private List<String> interpl_labels;
    private int interpl_window_size;

    /**
     * Decision Tree 변수
     * */
    private String interpl_decision_model_file_path;
    private String interpl_decision_model_file_name;
    private String decision_model_file_path;
    private String decision_model_file_name;

    /**
     * Random Forest 변수
     * */
    private int interpl_etc_model_seq;
    private String interpl_etc_model_file_path;
    private String interpl_etc_model_file_name;
}