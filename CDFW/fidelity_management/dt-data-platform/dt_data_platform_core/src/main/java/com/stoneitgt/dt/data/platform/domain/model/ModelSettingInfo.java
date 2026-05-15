package com.stoneitgt.dt.data.platform.domain.model;

import com.stoneitgt.dt.data.platform.domain.DTModelJsonProperty;
import lombok.Data;

import java.util.Map;

@Data
public class ModelSettingInfo {
    private String sdtId;
    private String sdtObjId;
    private String userPprcsFullStngValue;
    private String indexTrgtCol;
    private DTModelJsonProperty modelJsonProperty;
    private MetaDataDepth metaDataDepth;

    public ModelSettingInfo(String sdtId, String sdtObjId, String userPprcsFullStngValue, String indexTrgtCol) {
        this.sdtId = sdtId;
        this.sdtObjId = sdtObjId;
        this.userPprcsFullStngValue = userPprcsFullStngValue;
        this.indexTrgtCol = indexTrgtCol;
    }

    public ModelSettingInfo(Map<String, Object> params) {
        this.sdtId = params.get("sdt_id").toString();
        this.sdtObjId = params.get("sdt_obj_id").toString();
        this.userPprcsFullStngValue = params.get("user_pprcs_full_stng_value").toString();
        this.indexTrgtCol = params.get("index_trgt_col").toString();
    }

    public void setMetaDataDepth(Map<String, Object> params) {
        System.out.println("ModelSettingInfo.setMetaDataDepth: " + params);
        MetaDataDepth metaDataDepth = new MetaDataDepth();
        metaDataDepth.setDataSeq(Integer.parseInt(params.get("data_seq").toString()));
        metaDataDepth.setTwinId(params.get("twin_id") != null ? params.get("twin_id").toString() : null);
        metaDataDepth.setTwinNm(params.get("twin_nm") != null ? params.get("twin_nm").toString() : null);
        metaDataDepth.setTwinObjId(params.get("twin_obj_id") != null ? params.get("twin_obj_id").toString() : null);
        metaDataDepth.setTwinObjNm(params.get("twin_obj_nm") != null ? params.get("twin_obj_nm").toString() : null);
        metaDataDepth.setColumnDepth1(params.get("column_depth_1") != null ? params.get("column_depth_1").toString() : null);
        metaDataDepth.setColumnDepth2(params.get("column_depth_2") != null ? params.get("column_depth_2").toString() : null);
        metaDataDepth.setDataDepth1(params.get("data_depth_1") != null ? params.get("data_depth_1").toString() : null);
        metaDataDepth.setDataDepth2(params.get("data_depth_2") != null ? params.get("data_depth_2").toString() : null);
        metaDataDepth.setDataTimeYn(params.get("data_time_yn") != null ? params.get("data_time_yn").toString() : null);
        this.metaDataDepth = metaDataDepth;
    }
}
