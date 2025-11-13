package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class DTModelJsonPropertyMain {
	
    private String twin_id;
    private String twin_obj_id;
    private String data_use_tp;
    private String base_dir;
    private String base_file_nm;
    private String base_file_nm_set_range_row;
    private String base_file_nm_set_range_col;
    private String index_trgt_col;
    private String target_start_date;
    private String target_end_date;
    private String target_row_count;
    private String model_nm;
    private String model_derpn;
    private String rls_yn;
    private List<String> preproc_trgt_col;
    private int last_step_preproc_order;
    private String last_step_preproc_file_nm;	
    private List<DTModelJsonPropertySub> preproc_property;
    
    private String model_create;
    private List<DTModelJsonHyperParamSub> model_property;
    
	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
}
