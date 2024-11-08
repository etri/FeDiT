package com.stoneitgt.dt.data.platform.admin.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stoneitgt.dt.data.platform.admin.mapper.MakeMetaSimulationSchedulerMapper;

@Service
public class MakeMetaSimulationSchedulerService extends BaseService {

    @Autowired
    private MakeMetaSimulationSchedulerMapper makeMetaSimulationSchedulerMapper;

    public List<Map<String, Object>> getJobList(Map<String, Object> selectJobListParams) {
        return makeMetaSimulationSchedulerMapper.getJobList(selectJobListParams);
    }

    public Map<String, Object> getTargetModel(int modelSeq) {
        return makeMetaSimulationSchedulerMapper.getTargetModel(modelSeq);
    }

    public int saveAugmentLog(Map<String, Object> logParams) {
        return makeMetaSimulationSchedulerMapper.saveAugmentLog(logParams);
    }

    public int updateAugmentMain(Map<String, Object> logParams) {
        return makeMetaSimulationSchedulerMapper.updateAugmentMain(logParams);
    }

    public void updateAugmentStatusStop(int augmentSeq, String augmentStatus, String dataCrtLastHr) {
        makeMetaSimulationSchedulerMapper.updateAugmentStatusStop(augmentSeq, augmentStatus, dataCrtLastHr);
    }

    public void finishAugmentStatus(int augmentSeq, String augmentStatus) {
        makeMetaSimulationSchedulerMapper.finishAugmentStatus(augmentSeq, augmentStatus);
    }
}
