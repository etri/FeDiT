package com.stoneitgt.dt.data.platform.admin.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stoneitgt.dt.data.platform.admin.mapper.SimulationMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SimulationService extends BaseService {

    @Autowired
    private SimulationMapper simulationMapper;

    public List<Map<String, Object>> getModelDataTerm() {
        return simulationMapper.getModelDataTerm();
    }
}
