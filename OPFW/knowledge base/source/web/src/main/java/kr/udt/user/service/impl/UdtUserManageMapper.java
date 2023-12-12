package kr.udt.user.service.impl;

import java.util.List;
import java.util.Map;

import egovframework.rte.psl.dataaccess.mapper.Mapper;
import egovframework.rte.psl.dataaccess.util.EgovMap;


@Mapper("udtUserManageMapper")
public interface UdtUserManageMapper {
 
	public List<EgovMap> selectUdtWebUserList(Map<String,Object> parameterMap);
	
	public EgovMap selectOneUdtWebUser(Map<String,Object> parameterMap);
	
	public int doUserIdCheck(String userId);
	
	public int insertUdtWebUser(Map<String,Object> parameterMap);
	
	public int updateUdtWebUser(Map<String,Object> parameterMap);
	
}

