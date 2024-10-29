package kr.co.n2m.platform.meta.resource.agent.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.resource.agent.domain.AgentSearchVo;
import kr.co.n2m.platform.meta.resource.agent.domain.AgentVo;

@Mapper
public interface AgentMapper {
	
	/** 대리인 관리 목록 건수 조회 */
	int selectAgentCount(AgentSearchVo searchVo);
	
	/** 대리인 관리 목록 조회 */
	List<AgentVo> selectAgentList(AgentSearchVo searchVo);
	
	/** 대리인 단일 조회 */
	AgentVo selectAgent(AgentVo agentVo);
	
	/** 대리인 등록 - 자동생성 key */
	int insertAgentAutoKey(AgentVo agentVo);
	
	/** 메타데이터 table 내 대리인모델ID 존재 여부 확인 */
	boolean selectMetaDataByAgntModelId(AgentVo agentVo);
	
	/** 메타데이터셋 상태(메타코드) 존재 여부 확인 - mtcd_grp_id : MCG00001 인 컬럼에서 확인  */
	boolean selectMetaCodeBySttusMtcd(AgentVo agentVo);
	
	/** 대리인 수정 */
	int updateAgent(AgentVo agentVo);
	
	/** 대리인 삭제 */
	int deleteAgent(AgentVo agentVo);
	
	/** 대리인 상태 수정 (medata_set_sttus_mtcd : disuse) */
	int updateAgentStatus(AgentVo agentVo);
}
