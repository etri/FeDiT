package com.stoneitgt.dt.data.platform.admin.mapper;

import com.stoneitgt.dt.data.platform.domain.DTAugmentLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface MakeMetaSimulationSchedulerMapper {

    List<Map<String, Object>> getJobList();

    Map<String, Object> getTargetModel(int modelSeq);

    int saveAugmentLog(DTAugmentLog dtAugmentLog);

    int updateAugmentMain(Map<String, Object> logParams);

    void updateAugmentStatusStop(@Param("augmentSeq") int augmentSeq, @Param("augmentStatus") String augmentStatus, @Param("dataCrtLastHr") String dataCrtLastHr);

    void finishAugmentStatus(@Param("augmentSeq") int augmentSeq, @Param("augmentStatus") String augmentStatus);

    void updateAugmentCrtBgng(@Param("augmentSeq") int augmentSeq, @Param("datetime") String datetime);

    void updateAugmentCrtEnd(@Param("augmentSeq") int augmentSeq, @Param("datetime") String datetime);
}
