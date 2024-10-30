package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.session.RowBounds;

import com.stoneitgt.dt.data.platform.domain.SimulationModel;

@Mapper
public interface SimulationMapper {

    List<Map<String, Object>> getPredictionList(Map<String, Object> params, RowBounds paging);

    List<Map<String, Object>> getPredictionListSetUserSeq(Map<String, Object> params, RowBounds paging);

    List<Map<String, Object>> getPredictionSharedList(Map<String, Object> subParamsMap, RowBounds paging);

    List<Map<String, Object>> getPopupModelList();

    Map<String, Object> getModelInfo(int modelSeq);

    List<Map<String, Object>> getModelParams(Map<String, Object> paramsModelParams);

    List<Map<String, Object>> getModelFiles(int modelSeq);

    List<Map<String, Object>> getModelColumns(int modelSeq);

    int insertAugmentInfo(SimulationModel simulationModel);

    int updateAugmentStartTime(SimulationModel simulationModel);

    int updateAugmentEndTime(SimulationModel simulationModel);

    int updateAugmentStatus(SimulationModel simulationModel);

    SimulationModel getInsertSimulationViewResult(int augmentSeq);

    SimulationModel getSimulation(int augmentSeq);

    SimulationModel getSimulationUserSeq(SimulationModel simulationModel);

    int updateSimulationInfo(SimulationModel simulationModel);

    Map<String, Object> getModelFileInfo(int modelSeq);

    int deleteAugmentFile(SimulationModel simulationModel);

    int deleteAugment(SimulationModel simulationModel);

    List<Map<String, Object>> getModelDataTerm();
}
