package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MakeMetaSimulationSchedulerMapper {

    List<Map<String, Object>> getJobList(Map<String, Object> selectJobListParams);

    Map<String, Object> getTargetModel(int modelSeq);

    int saveAugmentLog(Map<String, Object> logParams);

    int updateAugmentMain(Map<String, Object> logParams);

    void updateAugmentStatusStop(@Param("augmentSeq") int augmentSeq, @Param("augmentStatus") String augmentStatus, @Param("dataCrtLastHr") String dataCrtLastHr);

    void finishAugmentStatus(@Param("augmentSeq") int augmentSeq, @Param("augmentStatus") String augmentStatus);
}
