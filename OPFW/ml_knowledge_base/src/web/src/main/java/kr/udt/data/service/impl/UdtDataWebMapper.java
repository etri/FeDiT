package kr.udt.data.service.impl;

import java.util.List;
import java.util.Map;

import egovframework.rte.psl.dataaccess.mapper.Mapper;
import egovframework.rte.psl.dataaccess.util.EgovMap;


/**
 * @설명 : UDT_WEB_USER DAO
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022. 10. 23
 * @비고 : 
 */
@Mapper("udtDataWebMapper")
public interface UdtDataWebMapper {
    public List<EgovMap> selectJobRunHstStatis(Map<String,Object> parameterMap);
    
    public List<EgovMap> selectJobRunHstList(Map<String,Object> parameterMap);
    
    public EgovMap selectJobRunHstStatisIndicators(Map<String,Object> parameterMap);
    
    public List<EgovMap> selectJobMntlyAccumulateData(Map<String,Object> parameterMap);
    
    public void callRetoreJobRunHstStatis(Map<String,Object> parameterMap);
    
    public List<EgovMap> selectJobRunHstDetailByExecId(Map<String,Object> parameterMap);
    
    
}

