package kr.udt.data.mapper;

import java.util.List;
import java.util.Map;

import kr.udt.data.dto.JobLinkConfigDTO;
import kr.udt.data.dto.JobMstDTO;
import kr.udt.data.dto.JobRunDetailHstDTO;
import kr.udt.data.dto.JobRunHstDTO;
import kr.udt.data.dto.ProcessMstDTO;
import kr.udt.data.dto.UdtFileDTO;

/**
 * @설명 : postgres DAO MAPPER객체 
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022. 11. 03.
 * @비고 :
 */
public interface UdtDataFlowMapper {
	
	public List<JobMstDTO> getAllJobMst();
	
	public void updateJobMstUseAt(JobMstDTO dto);
	
	public JobMstDTO getOneJobMst(JobMstDTO dto);
	
	public JobMstDTO getOneJobMstByEnNm(JobMstDTO dto);

	public List<ProcessMstDTO> getProcessMstWithSnByJobId(JobMstDTO dto);
	
	public JobLinkConfigDTO getOneJobLinkConfig(JobMstDTO dto);
	
	public int insertUdtFile(UdtFileDTO dto);
	
	public int insertJobRunHstCreate(JobRunHstDTO dto);
	
	public int insertOpenApiData(Map<String, Object> fieldData);

	public int updateJobRunHst(JobRunHstDTO dto);
	
	public int insertJobRunDetailHst(JobRunDetailHstDTO dto);

}
