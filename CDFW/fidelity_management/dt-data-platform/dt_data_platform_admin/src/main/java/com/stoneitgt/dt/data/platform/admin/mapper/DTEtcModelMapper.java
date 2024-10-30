package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.session.RowBounds;

import com.stoneitgt.dt.data.platform.domain.AugmentModel;
import com.stoneitgt.dt.data.platform.domain.AugmentModelColumn;
import com.stoneitgt.dt.data.platform.domain.AugmentModelParams;
import com.stoneitgt.dt.data.platform.domain.DTModel;
import com.stoneitgt.dt.data.platform.domain.DTModelColumn;
import com.stoneitgt.dt.data.platform.domain.DTModelEtc;
import com.stoneitgt.dt.data.platform.domain.DTModelEtcColumn;
import com.stoneitgt.dt.data.platform.domain.DTModelEtcMetaUserItem;
import com.stoneitgt.dt.data.platform.domain.DTModelEtcParams;
import com.stoneitgt.dt.data.platform.domain.DTModelMetaUserItem;
import com.stoneitgt.dt.data.platform.domain.DTModelMetaUserItemPreprocessMapInterpl;
import com.stoneitgt.dt.data.platform.domain.DTModelMetaUserItemPreprocessMapOutlr;
import com.stoneitgt.dt.data.platform.domain.DTModelMetaUserItemPreprocessMapResmpl;
import com.stoneitgt.dt.data.platform.domain.DTModelMetaUserItemPreprocessMapUnit;
import com.stoneitgt.dt.data.platform.domain.DTModelMetaUserItemPreprocessMapVrfc;
import com.stoneitgt.dt.data.platform.domain.DTModelParams;
import com.stoneitgt.dt.data.platform.domain.Files;
import com.stoneitgt.dt.data.platform.domain.Menu;
import com.stoneitgt.dt.data.platform.domain.MenuAuth;
import com.stoneitgt.dt.data.platform.domain.MetaOriginFullTextModel;
import com.stoneitgt.dt.data.platform.domain.MetaOriginItemModel;
import com.stoneitgt.dt.data.platform.domain.MetaOriginModel;

@Mapper
public interface DTEtcModelMapper {

    List<Map<String, Object>> getDTEtcModelList(Map<String, Object> params, RowBounds paging);

    List<Map<String, Object>> getDTEtcModelListSetUserSeq(Map<String, Object> params, RowBounds paging);

    int insertDTModelEtc(DTModelEtc dtModelEtc);

    int insertDTModelEtcMetaUserItem(DTModelEtcMetaUserItem dtModelEtcMetaUserItem);

    DTModelEtc getAugmentModel(int modelSeq);

    DTModelEtc selectMetaModel(int modelSeq);

    DTModelEtcMetaUserItem selectMetaUserItem(int modelSeq);

    int getAlgorithmModelParamsCount(DTModelEtcParams dTModelEtcParams);

    int deleteAlgorithmModelParams(DTModelEtcParams dTModelEtcParams);

    int saveAlgorithmModelParams(DTModelEtcParams dTModelEtcParams);

    int saveAlgorithmModelColumn(DTModelEtcColumn dTModelEtcColumn);

    Files getDtPreprocLastFile(int modelSeq);

    List<Map<String, Object>> getAlgolithmList();

    List<Map<String, Object>> getUnitCodeList();

    List<Map<String, Object>> getUnitTpList(String unit);

    String getUnitFormula(Map<String, Object> params);

    int updateAlgorithmSeq(Map<String, Object> requestBody);

    List<Map<String, Object>> getModelAlgorithmParamsList(Map<String, Object> map);

    List<Map<String, Object>> getAlgolithmCodeList(String code);

    int updateMetaUerItemFulltext(Map<String, Object> param);

    List<Map<String, Object>> getModelLoss(int modelSeq);

    List<Map<String, Object>> getModelFID(int modelSeq);

    List<Map<String, Object>> getEtcAEModelList(Map<String, Object> etcParams);
    List<Map<String, Object>> getEtcRFModelList(Map<String, Object> etcParams);

    void deleteModel(Map<String, Object> parameters);

    void deleteModelFiles(Map<String, Object> parameters);

    void deleteModelColumn(Map<String, Object> parameters);

    void deleteModelLoss(Map<String, Object> parameters);

    void deleteModelParams(Map<String, Object> parameters);

    Map<String, Object> getModelAlgorithmBySeq(@Param("modelAlgrmSeq") int modelAlgrmSeq);

    List<Map<String, Object>> getDTEtcModelListByModelTp(Map<String, Object> params, RowBounds paging);

    List<Map<String, Object>> getDTEtcModelListSetUserSeqByModelTp(Map<String, Object> params, RowBounds paging);

    List<Map<String, Object>> getDTEtcModelSharedListByModelTp(Map<String, Object> paramsMap, RowBounds paging);

    List<Map<String, Object>> getEtcBritsModelList(Map<String, Object> etcParams);
}
