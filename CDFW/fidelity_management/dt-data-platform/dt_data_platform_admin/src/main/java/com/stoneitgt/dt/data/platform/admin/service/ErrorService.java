package com.stoneitgt.dt.data.platform.admin.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stoneitgt.dt.data.platform.admin.mapper.CodeMapper;
import com.stoneitgt.dt.data.platform.admin.mapper.ErrorMapper;
import com.stoneitgt.dt.data.platform.domain.CodeDtl;
import com.stoneitgt.dt.data.platform.domain.CodeMst;
import com.stoneitgt.dt.data.platform.domain.ErrorLog;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;


@Service
public class ErrorService {

    @Autowired
    private ErrorMapper errorMapper;

    public int saveErrorLog(ErrorLog errorLog) {
        return errorMapper.saveErrorLog(errorLog);
    }


    public ErrorLog getErrorLog(int etcModelSeq, String ERROR_LCT) {
        return errorMapper.getErrorLog(etcModelSeq, ERROR_LCT);
    }
}
