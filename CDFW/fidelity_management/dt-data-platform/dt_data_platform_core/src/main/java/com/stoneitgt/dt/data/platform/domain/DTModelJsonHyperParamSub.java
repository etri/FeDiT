package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import lombok.Data;

@Data
public class DTModelJsonHyperParamSub {
	
	private List<String> dependent;
	private List<String> independent;
    private String algorithm;
    private int algorithm_seq;
    
    private DTModelJsonHyperParamSubSet hyperparam;
	/*
    private int preprocOrder;
    private String preprocType;
    */
}
