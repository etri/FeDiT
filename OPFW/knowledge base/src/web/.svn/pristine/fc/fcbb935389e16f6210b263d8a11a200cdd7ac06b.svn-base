package kr.udt.file.service.impl;

import java.util.List;
import java.util.Map;

import egovframework.rte.psl.dataaccess.mapper.Mapper;
import egovframework.rte.psl.dataaccess.util.EgovMap;
import kr.udt.file.service.SrcDataInsertVO;



@Mapper("udtFileMapper")
public interface UdtFileMapper {
    
	public String[] selectTbColNms(String tbNm);
	
	public List<EgovMap> selectSrcTableInfo();
	 
	public List<EgovMap> selectOneUdtFile(Map fileIdInfo);
	
	public List<EgovMap> selectSrcDataFileHstByTbNm(Map parameters);
	
	public int bulkInsertNewlySrcData(SrcDataInsertVO bulkInsertVo);
	
	public int bulkInsertBackupSrcDataTable(SrcDataInsertVO bulkInsertVo);
	
	public void bulkUpdateNewlySrcDataTimestamp(SrcDataInsertVO bulkInsertVo);
	
	public void truncateSrcDataTable(SrcDataInsertVO bulkInsertVo);
	
	public void insertUdtFile(Map fileInfo);
	
	public void updateSrcTableInfo(Map srcTbInfo);
	
	public void insertSrcTableDataFileHst(Map srcTbInfo);
}

