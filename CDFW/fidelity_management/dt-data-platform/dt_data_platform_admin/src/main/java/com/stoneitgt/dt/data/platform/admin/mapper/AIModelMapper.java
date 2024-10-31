package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.session.RowBounds;

import com.stoneitgt.dt.data.platform.domain.AugmentModel;
import com.stoneitgt.dt.data.platform.domain.AugmentModelColumn;
import com.stoneitgt.dt.data.platform.domain.AugmentModelParams;

@Mapper
public interface AIModelMapper {

    List<Map<String, Object>> getAugmentModelList(Map<String, Object> params, RowBounds paging);

    int saveModelOriginData(AugmentModel augmentModel);

    int insertIterpolatefile(Map<String, Object> interpolateParam);

    int updateAugmentModel(Map<String, Object> interpolateParam);


    void insertResamplefile(Map<String, Object> resampleParam);

    int updateResampleAugmentModel(Map<String, Object> resampleParam);

    int getCountResampleFileInfo(Map<String, Object> resampleParam);

    int updateResampleFileInfo(Map<String, Object> resampleParam);

    int getCountInterpolateFileInfo(Map<String, Object> interpolateParam);

    int updateInterpolateFileInfo(Map<String, Object> interpolateParam);

    List<Map<String, Object>> getAlgolithmList();

    List<Map<String, Object>> getAlgolithmItemList(String string);

    List<Map<String, Object>> getAlgolithmCodeList(String code);

    List<Map<String, Object>> getModelAlgorithmItem(int parseInt);

    int saveAlgorithmModelParams(AugmentModelParams augmentModelParams);

    int getAlgorithmModelParamsCount(AugmentModelParams augmentModelParams);

    int deleteAlgorithmModelParams(AugmentModelParams augmentModelParams);

    int deleteAlgorithmModelColumn(AugmentModelParams augmentModelParams);

    int saveAlgorithmModelColumn(AugmentModelParams augmentModelParams);

    int saveAlgorithmModelColumn(AugmentModelColumn augmentModelColumn);

    AugmentModel getAugmentModel(int modelSeq);

    List<Map<String, Object>> getAugmentModelColumn(int modelSeq);

    List<Map<String, Object>> getAugmentModelFID(int modelSeq);

    List<Map<String, Object>> getAugmentModelLoss(int modelSeq);

    List<Map<String, Object>> getAugmentModelParams(int modelSeq);

    List<Map<String, Object>> getModelAlgorithmParamsList(Map<String, Object> map);

    int updateAlgorithmSeq(Map<String, Object> requestBody);

    String getModelFileDir(int modelSeq);

    int deleteModelFile(int modelSeq);

    int deleteModelColumn(int modelSeq);

    int deleteModelFid(int modelSeq);

    int deleteModelLoss(int modelSeq);

    int deleteModelParams(int modelSeq);

    int updateModelOriginData(AugmentModel augmentModel);

    int insertTestFileInfo(Map<String, Object> testParam);

    int getCountTestFileInfo(Map<String, Object> testParam);

    int updateTestFileInfo(Map<String, Object> testParam);

    int insertPredFileInfo(Map<String, Object> predParam);

    int getCountPredFileInfo(Map<String, Object> predParam);

    int updatePredFileInfo(Map<String, Object> predParam);

    List<Map<String, Object>> getResampleFileInfo(int modelSeq);

    int getCorrelationFileCnt(int modelSeq);

    int upCorrelationFileInfo(Map<String, Object> correlationParam);

    int insertCorrelationFileInfo(Map<String, Object> correlationParam);

    List<String> getTargetColumnInfo(int modelSeq);

    List<Map<String, Object>> resetFileList(int modelSeq);

    int deleteResetFileList(Map<String, Object> tmp);

    List<Map<String, Object>> getUnitCodeList();

    String getUnitFormula(Map<String, Object> params);

    List<Map<String, Object>> getModelLoss(int modelSeq);

    List<Map<String, Object>> getModelFID(int modelSeq);

    int updateModelInfo(AugmentModel augmentModel);

    List<Map<String, Object>> resetProcTargetFileList(Map<String, Object> params);

    List<Map<String, Object>> getUnitTpList(String unit);

    int getCountModelUnitParams(Map<String, Object> unitParam);

    int updateModelUnitParams(Map<String, Object> unitParam);

    int insertModelUnitParams(Map<String, Object> unitParam);

    List<Map<String, Object>> getUnitParamList(int modelSeq);

    int deleteUnitParamList(int model_seq);

    int getCountModelFileInfo(Map<String, Object> modelParam);

    int updateModelFileInfo(Map<String, Object> modelParam);

    int insertModelFileInfo(Map<String, Object> modelParam);

    int deleteModel(AugmentModel augmentModel);

    List<Map<String, Object>> getAugmentModelListSetUserSeq(Map<String, Object> params, RowBounds paging);

    AugmentModel getAugmentModelSetUserSeq(AugmentModel augmentModel);

    List<Map<String, Object>> getAugmentModelSharedList(Map<String, Object> subParamsMap, RowBounds paging);

    Map<String, Object> getVerifyOption(int vrfcSeq);

    int getCountModelValidateParams(Map<String, Object> validParam);

    int updateModelValidateParams(Map<String, Object> validParam);

    int insertModelValidateParams(Map<String, Object> validParam);

    List<Map<String, Object>> getValidateParamList(int modelSeq);

    int updateNullResmpltOptionDateTerm(AugmentModel augmentModel);

    int insertOutlierfile(Map<String, Object> outlierParam);

    int getCountOutlierFileInfo(Map<String, Object> outlierParam);

    int updateOutlierFileInfo(Map<String, Object> outlierParam);

    int updateTargetCollist(Map<String, Object> params);
}
