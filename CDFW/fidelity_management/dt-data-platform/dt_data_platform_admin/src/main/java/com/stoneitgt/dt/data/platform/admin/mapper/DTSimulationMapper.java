package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.session.RowBounds;

import com.stoneitgt.dt.data.platform.domain.AugmentModel;
import com.stoneitgt.dt.data.platform.domain.AugmentModelColumn;
import com.stoneitgt.dt.data.platform.domain.AugmentModelParams;
import com.stoneitgt.dt.data.platform.domain.DTAugment;
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
import com.stoneitgt.dt.data.platform.domain.SimulationModel;
import org.springframework.security.core.parameters.P;

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

    int updateAugmentStatus(Map<String, Object> setParam);

    int updateSimulationInfo(SimulationModel simulationModel);

    Map<String, Object> getSimulationPredictionView(@Param("augmentSeq") int augmentSeq);

    List<String> getTargetColumnInfo(@Param("modelSeq") int modelSeq);

    SimulationModel getInsertSimulationViewResult(@Param("augmentSeq") int augmentSeq);

    boolean checkUseDTModel(@Param("model_seq") int modelSeq);

    void deleteDTSimulation(Map<String, Object> parameters);

    List<Map<String, Object>> getDTSimulationListBySimTp(Map<String, Object> params, RowBounds paging);

    List<Map<String, Object>> getDTSimulationListSetUserSeqBySimTp(Map<String, Object> params, RowBounds paging);

    List<Map<String, Object>> getDTSimulationSharedListBySimTp(Map<String, Object> params, RowBounds paging);

    boolean checkUseRemakeDTModel(@Param("model_seq") int modelSeq);
}
