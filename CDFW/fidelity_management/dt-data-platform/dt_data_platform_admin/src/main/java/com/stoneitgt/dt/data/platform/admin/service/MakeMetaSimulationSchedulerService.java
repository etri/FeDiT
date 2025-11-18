package com.stoneitgt.dt.data.platform.admin.service;

import com.stoneitgt.dt.data.platform.admin.mapper.MakeMetaSimulationSchedulerMapper;
import com.stoneitgt.dt.data.platform.domain.DTAugmentLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MakeMetaSimulationSchedulerService extends BaseService {

    @Autowired
    private MakeMetaSimulationSchedulerMapper makeMetaSimulationSchedulerMapper;

    public List<Map<String, Object>> getJobList() {
        return makeMetaSimulationSchedulerMapper.getJobList();
    }

    public List<Map<String, Object>> getJobList(Map<String, Object> params) {
        return makeMetaSimulationSchedulerMapper.getJobList();
    }

    public Map<String, Object> getTargetModel(int modelSeq) {
        return makeMetaSimulationSchedulerMapper.getTargetModel(modelSeq);
    }

    public int saveAugmentLog(DTAugmentLog dtAugmentLog) {
        return makeMetaSimulationSchedulerMapper.saveAugmentLog(dtAugmentLog);
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

    public void updateAugmentCrtBgng(int augmentSeq, String datetime) {
        makeMetaSimulationSchedulerMapper.updateAugmentCrtBgng(augmentSeq, datetime);
    }

    public void updateAugmentCrtEnd(int augmentSeq, String datetime) {
        makeMetaSimulationSchedulerMapper.updateAugmentCrtEnd(augmentSeq, datetime);
    }
}
