package kr.co.n2m.platform.meta.resource.agent.service;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.resource.agent.domain.AgentSearchVo;
import kr.co.n2m.platform.meta.resource.agent.domain.AgentVo;
import kr.co.n2m.platform.meta.resource.agent.mapper.AgentMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class AgentService {
	
	@Autowired
	private AgentMapper agentMapper;
	
	private final String CREATE_MODE = "Create";
	private final String UPDATE_MODE = "Update";
	
	/**
	 * 대리인 목록 조회
	 * @Author      : solee
	 * @Date        : 2023. 04. 24.
	 * @param agentSearchVo
	 * @return
	 */
	public SearchResultListVo getAgentList(AgentSearchVo searchVo) {
		log.debug("[대리인 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			
			int totalListSize = agentMapper.selectAgentCount(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<AgentVo> list = agentMapper.selectAgentList(searchVo);
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
		} catch (Exception e) {
			log.error("[대리인 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}
		
		log.debug("[대리인 목록 조회] 서비스 종료");
		return listVo;
	}
	
	/**
	 * 대리인 상세 조회
	 * @Author      : solee
	 * @Date        : 2023. 04. 24.
	 * @param agentSearchVo
	 * @return
	 */	
	public AgentVo getAgent(String agntId) {
		log.debug("[대리인 상세 조회] 서비스 시작");
		AgentVo vo = null;
		
		try {
		
			AgentVo paramVo = new AgentVo();
			paramVo.setAgntId(agntId);
			vo = agentMapper.selectAgent(paramVo);
			
		} catch (Exception e) {
			log.error("[대리인 상세 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[대리인 상세 조회] 서비스 종료");
		return vo;
	}
	
	/**
	 * 대리인 등록
	 * @Author      : solee
	 * @Date        : 2023. 04. 25.
	 * @param agentVo
	 * @return
	 */	
	public String createAgent(AgentVo agentVo) {
		log.debug("[대리인 등록] 서비스 시작");
		
		try {

			agentFormValidation(agentVo, CREATE_MODE);
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			agentVo.setAgntRegrId(loginUserVo.getUserId());
			agentVo.setAgntRegrNm(loginUserVo.getUserNm());
			agentVo.setAgntAmdrId(loginUserVo.getUserId());
			agentVo.setAgntAmdrNm(loginUserVo.getUserNm());			
			
			agentMapper.insertAgentAutoKey(agentVo);
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[대리인 등록] 대리인 등록 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[대리인 등록] 대리인 등록 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}
		
		log.debug("[대리인 등록] 서비스 종료");
		return agentVo.getAgntId();
	}
	
	/**
	 * 대리인 수정
	 * @Author      : solee
	 * @Date        : 2023. 04. 25.
	 * @param agentVo
	 * @return
	 */	
	public void modifyAgent(AgentVo agentVo) {
		log.debug("[대리인 수정] 서비스 시작");
		
		try {
			
			agentFormValidation(agentVo, UPDATE_MODE);
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			agentVo.setAgntAmdrId(loginUserVo.getUserId());
			agentVo.setAgntAmdrNm(loginUserVo.getUserNm());			
			
			agentMapper.updateAgent(agentVo);			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[대리인 수정] 대리인 수정 실패/오류 (정보성) : {}", e.getMessage());
			throw e;				
		} catch (Exception e) {
			log.error("[대리인 수정] 대리인 수정 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[대리인 수정] 서비스 종료");
	}
	
	/**
	 * 대리인 삭제
	 * @Author      : solee
	 * @Date        : 2023. 04. 25.
	 * @param agentVo
	 * @return
	 */	
	public void deleteAgent(String agntId) {
		log.debug("[대리인 삭제] 서비스 시작");
		
		try {
			
			StringBuffer sb = new StringBuffer();
			
			//필수 check
			if (StringUtils.isBlank(agntId)) { sb.append("agntId").append(ValueUtil.required()).append("\n"); }

			if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
			
			//data check
			AgentVo paramVo = new AgentVo();
			paramVo.setAgntId(agntId);
			
			AgentVo delVo = agentMapper.selectAgent(paramVo);
			if (delVo == null) throw new ResBadRequestException("대리인 데이터가 존재하지 않습니다.");
			
			//delete or state update check
			boolean isMetaModelExist = agentMapper.selectMetaDataByAgntModelId(delVo);
			if (isMetaModelExist) {
				delVo.setMedataSetSttusMtcd("disuse");
				agentMapper.updateAgentStatus(delVo);
			} else {
				agentMapper.deleteAgent(delVo);
			}
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[대리인 삭제] 대리인 삭제 실패/오류 (정보성) : {}", e.getMessage());
			throw e;					
		} catch (Exception e) {
			log.error("[대리인 삭제] 대리인 삭제 실패/오류", e);
		}
	}
	
	/**
	 * 대리인 VO validation
	 * */
	private void agentFormValidation(AgentVo agentVo, String modeType) {
			
		StringBuffer sb = new StringBuffer();
		
		//필수 check
		if (StringUtils.isBlank(agentVo.getAgntNm())) { sb.append("agntNm").append(ValueUtil.required()).append("\n"); }
		if (UPDATE_MODE.equals(modeType) && StringUtils.isBlank(agentVo.getAgntId())) {
			sb.append("agntId").append(ValueUtil.required()).append("\n");		
		}
		if (UPDATE_MODE.equals(modeType) && StringUtils.isBlank(agentVo.getMedataSetSttusMtcd())) {
			sb.append("medataSetSttusMtcd").append(ValueUtil.required()).append("\n");
		}
		
		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
		
		//기존 참조 data check
		if (!StringUtils.isBlank(agentVo.getMedataSetSttusMtcd())) {
			boolean isValidMtcd = agentMapper.selectMetaCodeBySttusMtcd(agentVo);
			if (!isValidMtcd) {
				throw new ResBizInfoException("존재하지 않는 코드입니다.");
			}
		}
		
		//default value set
		if (CREATE_MODE.equals(modeType) && StringUtils.isBlank(agentVo.getMedataSetSttusMtcd())) {
			agentVo.setMedataSetSttusMtcd("use");
		}
		
		if (StringUtils.isBlank(agentVo.getAgntModelId())) {
			agentVo.setAgntModelId("AgentOrganization");
		}					
	}
	
}
