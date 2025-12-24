package com.stoneitgt.dt.data.platform.admin.mapper;

import com.stoneitgt.dt.data.platform.domain.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.session.RowBounds;

import java.util.List;
import java.util.Map;

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

    void deleteModelLoss(int modelSeq);

    void deleteModelFid(int modelSeq);

    boolean checkUseBritsModel(@Param("model_seq") int britsModelSeq);

    boolean checkUseNaomiModel(@Param("model_seq") int naomiModelSeq);

    List<Map<String, Object>> getDTAllSharedList(Map<String, Object> params, RowBounds paging);

    int getCountXAIFileInfo(Map<String, Object> xaiParams);

    int insertXAIFileInfo(Map<String, Object> xaiParams);

    int updateXAIFileInfo(Map<String, Object> xaiParams);

    void deleteModelXAI(int modelSeq, String ref_tp);

    Map<String, Object> getModelXAI(@Param("modelSeq") int modelSeq);

    int countMetaModel();

    int countMetaModelByAlgrmSeq(int modelAlgrmSeq);

    String findPreprocessJSONByModelSeq(int modelSeq);
}
