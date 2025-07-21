package com.stoneitgt.dt.data.platform.admin.service;

import com.stoneitgt.dt.data.platform.admin.mapper.ErrorMapper;
import com.stoneitgt.dt.data.platform.domain.ErrorLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class ErrorService {

    @Autowired
    private ErrorMapper errorMapper;

    public int saveErrorLog(ErrorLog errorLog) {
        return errorMapper.saveErrorLog(errorLog);
    }

    public ErrorLog getErrorLog(int modelSeq, String ERROR_LCT) {
        return errorMapper.getErrorLog(modelSeq, ERROR_LCT);
    }
}
