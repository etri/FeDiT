package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import lombok.Data;

@Data
public class DTModelJsonPropertySub {
	
    private int preproc_order;
    private String preproc_type;
    private List<DTModelJsonPropertySubSet> preproc_set;
}