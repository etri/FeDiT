package com.stoneitgt.dt.data.platform.admin.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.stoneitgt.dt.data.platform.domain.ErrorLog;

@Mapper
public interface ErrorMapper {

    int saveErrorLog(ErrorLog errorLog);

    ErrorLog getErrorLog(@Param("modelSeq") int modelSeq, @Param("ERROR_LCT") String ERROR_LCT);
}
