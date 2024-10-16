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
public interface DTModelMapper {

    List<Map<String, Object>> getDTModelList(Map<String, Object> params, RowBounds paging);

    int insertDTModel(DTModel dtModel);

    int insertDTModelMetaUserItem(DTModelMetaUserItem dtModelMetaUserItem);

    int insertPreprocessMapVrfc(DTModelMetaUserItemPreprocessMapVrfc preprocessMapVrfc);

    int insertPreprocessMapOutlr(DTModelMetaUserItemPreprocessMapOutlr preprocessMapOutlr);

    int insertPreprocessMapInterpl(DTModelMetaUserItemPreprocessMapInterpl preprocessMapInterpl);

    int insertPreprocessMapResmpl(DTModelMetaUserItemPreprocessMapResmpl preprocessMapResmpl);

    int insertPreprocessMapUnit(DTModelMetaUserItemPreprocessMapUnit preprocessMapUnit);

    Files getDtPreprocLastFile(int modelSeq);

    DTModel getAugmentModel(int modelSeq);

    List<Map<String, Object>> getDTModelListSetUserSeq(Map<String, Object> params, RowBounds paging);

    List<Map<String, Object>> getDTModelSharedList(Map<String, Object> subParamsMap, RowBounds paging);

    List<Map<String, Object>> getAlgolithmList();

    List<Map<String, Object>> getUnitCodeList();

    List<Map<String, Object>> getUnitTpList(String unit);

    String getUnitFormula(Map<String, Object> params);

    DTModel selectMetaModel(int modelSeq);


    DTModelMetaUserItem selectMetaUserItem(int modelSeq);


    List<DTModelMetaUserItemPreprocessMapVrfc> selectMetaPreprocessVrfc(int userMetaItemSeq);


    List<DTModelMetaUserItemPreprocessMapOutlr> selectMetaPreprocessOutlr(int userMetaItemSeq);


    List<DTModelMetaUserItemPreprocessMapInterpl> selectMetaPreprocessInterpl(int userMetaItemSeq);


    List<DTModelMetaUserItemPreprocessMapResmpl> selectMetaPreprocessResmpl(int userMetaItemSeq);


    List<DTModelMetaUserItemPreprocessMapUnit> selectMetaPreprocessUnit(int userMetaItemSeq);


    int getAlgorithmModelParamsCount(DTModelParams dtModelParams);


    int deleteAlgorithmModelParams(DTModelParams dtModelParams);


    int deleteAlgorithmModelColumn(DTModelParams dtModelParams);


    int saveAlgorithmModelParams(DTModelParams dtModelParams);


    int saveAlgorithmModelColumn(DTModelColumn dtModelColumn);


    int updateAlgorithmSeq(Map<String, Object> requestBody);


    List<Map<String, Object>> getModelAlgorithmParamsList(Map<String, Object> map);


    List<Map<String, Object>> getAlgolithmCodeList(String code);


    int updateMetaUerItemFulltext(Map<String, Object> param);

    int getCountModelFileInfo(Map<String, Object> modelParam);

    int updateModelFileInfo(Map<String, Object> modelParam);

    int insertModelFileInfo(Map<String, Object> modelParam);

    int getCountTestFileInfo(Map<String, Object> testParam);

    int updateTestFileInfo(Map<String, Object> testParam);

    int insertTestFileInfo(Map<String, Object> testParam);

    int getCountPredFileInfo(Map<String, Object> predParam);

    int updatePredFileInfo(Map<String, Object> predParam);

    int insertPredFileInfo(Map<String, Object> predParam);

    List<Map<String, Object>> getModelLoss(int modelSeq);

    List<Map<String, Object>> getModelFID(int modelSeq);

    Map<String, Object> getEtcModelInfo(Map<String, Object> params);

    Map<String, Object> getMetaDataJsonDepth(Map<String, Object> param);

    boolean checkUseAEModel(@Param("model_seq") int aeModelSeq);

    void deleteModel(Map<String, Object> parameters);

    boolean checkUseRFModel(@Param("model_seq") int rfModelSeq);

    List<Map<String, Object>> getDTModelSharedListByJobLevel(Map<String, Object> params, RowBounds paging);

    void deleteModelLoss(int modelSeq);

    void deleteModelFid(int modelSeq);
}
