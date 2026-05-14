package com.stoneitgt.dt.data.platform.domain.model;


import lombok.Data;

@Data
public class MetaDataDepth {
    private int dataSeq;
    private String twinId;
    private String twinNm;
    private String twinObjId;
    private String twinObjNm;
    private String columnDepth1;
    private String columnDepth2;
    private String dataDepth1;
    private String dataDepth2;
    private String dataTimeYn;
}
