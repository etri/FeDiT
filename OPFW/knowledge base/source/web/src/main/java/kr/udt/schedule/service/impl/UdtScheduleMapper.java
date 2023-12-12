package kr.udt.schedule.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import egovframework.rte.psl.dataaccess.mapper.Mapper;
import egovframework.rte.psl.dataaccess.util.EgovMap;



@Mapper("udtScheduleMapper")
public interface UdtScheduleMapper {
	
	public List<EgovMap> selectAllJobMstWithJobConfig(Map<String,Object> parameterMap);
	
	public List<EgovMap> selectRdfMetaDatasetTitleList();
	
	public EgovMap selectOneRdfMetaCommon(Map<String,Object> parameterMap);
	
	public EgovMap selectOneRdfMetaDataset(Map<String,Object> parameterMap);
	
	public int insertNewRdfMetaCommon(Map<String,Object> parameterMap);
	
	public int insertNewRdfMetaDataset(Map<String,Object> parameterMap);
	
	public int updateJobMstByJobId(Map<String,Object> parameterMap);
	
	public int updateJobLinkConfigByJobId(Map<String,Object> parameterMap);
	
	public EgovMap selectOneJobLinkConfig(Map<String,Object> parameterMap);

	public int insertNewDataset(HashMap<String, Object> param);

	public int insertNewDatasetLinkConfig(HashMap<String, Object> param);

	public List<EgovMap> selectJobSaveTblNmList(HashMap<String, Object> param);

	public void createNewDatasetTbl(HashMap<String, Object> param);

	public int deleteDataset(HashMap<String, Object> param);

	public int deleteDatasetLinkConfig(HashMap<String, Object> param);

	public int dropDatasetLinkTable(HashMap<String, Object> param);

	public int updateDatasetLinkConfig(HashMap<String, Object> param);

	public int updateDataset(HashMap<String, Object> param);

	public void insertJobProcessSn(HashMap<String, Object> param);

	public int deleteJobProcessSn(HashMap<String, Object> param);
	
}

