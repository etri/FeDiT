package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.session.RowBounds;

import com.stoneitgt.dt.data.platform.domain.CodeDtl;
import com.stoneitgt.dt.data.platform.domain.CodeMst;
import com.stoneitgt.dt.data.platform.domain.ErrorLog;

@Mapper
public interface ErrorMapper {

    int saveErrorLog(ErrorLog errorLog);

    ErrorLog getErrorLog(@Param("etcModelSeq") int etcModelSeq, @Param("ERROR_LCT") String ERROR_LCT);
}
