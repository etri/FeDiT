package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class DTModelJsonHyperParamSubSet {
	
    private String window_size;
    private String batch_size;
    private String epochs;
    private String loss;
    private String loss_nm;
    private String meterics;
    private String meterics_nm;
    private String optimizer;
    private String optimizer_nm;
    private String optimizer_lr;
    private String test_size;
    private String data_size;
    
	/*
    private int preprocOrder;
    private String preprocType;
    */
}
