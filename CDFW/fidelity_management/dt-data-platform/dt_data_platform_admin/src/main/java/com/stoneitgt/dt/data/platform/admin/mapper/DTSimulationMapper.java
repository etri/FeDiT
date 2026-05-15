package com.stoneitgt.dt.data.platform.admin.mapper;

import com.stoneitgt.dt.data.platform.domain.DTAugment;
import com.stoneitgt.dt.data.platform.domain.SimulationModel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.session.RowBounds;

import java.util.List;
import java.util.Map;

@Mapper
public interface DTSimulationMapper {

    List<Map<String, Object>> getDTSimulationList(Map<String, Object> params, RowBounds paging);

    List<Map<String, Object>> getDTSimulationListSetUserSeq(Map<String, Object> params, RowBounds paging);

    List<Map<String, Object>> getDTSimulationSharedList(Map<String, Object> subParamsMap, RowBounds paging);

    List<Map<String, Object>> getSimulationSetModelList(Map<String, Object> param);

    Map<String, Object> getSimulationSetModelProperty(Map<String, Object> param);

    int getSimulationSaveAugment(Map<String, Object> param);

    DTAugment getDTSimulation(int augmentSeq);

    List<Map<String, Object>> getDTSimulationFileList(int augmentSeq);

    List<Map<String, Object>> getDTSimulationLogList(int augmentSeq);

    Map<String, Object> getModelInfo(int modelSeq);

    List<Map<String, Object>> getModelParams(Map<String, Object> paramsModelParams);

    Map<String, Object> getModelFiles(int modelSeq);

    List<Map<String, Object>> getModelColumns(int modelSeq);

    int getSimulationSaveAugmentOnetime(DTAugment dtAugment);

    int updateSimulationInfo(SimulationModel simulationModel);

    Map<String, Object> getSimulationPredictionView(@Param("augmentSeq") int augmentSeq);

    List<String> getTargetColumnInfo(@Param("modelSeq") int modelSeq);

    boolean checkUseDTModel(@Param("model_seq") int modelSeq);

    void deleteDTSimulation(Map<String, Object> parameters);

    boolean checkUseRemakeDTModel(@Param("model_seq") int modelSeq);

    int countMetaSimulation();

    List<Map<String, Object>> getModelDataTerm();

    // void updateSimulationSaveAugment(int augmentSeq, String digitalTwinId, String newDigitalTwinObjectId);
    void updateSimulationSaveAugment(@Param("augmentSeq") int augmentSeq,
                                     @Param("digitalTwinId") String digitalTwinId,
                                     @Param("newDigitalTwinObjectId") String newDigitalTwinObjectId);
}
