package kr.co.n2m.platform.meta.rdf.virtuoso.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfTripleLogSearchVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfTripleLogVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.mapper.RdfTripleLogMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class RdfTripleLogService {

	@Autowired
    private RdfTripleLogMapper rdfTripleLogMapper;
	
	/**
	 * RDF 트리플 로그 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 07. 24.
	 * @param rdfTripleLogSearchVo
	 * @return
	 */
	public SearchResultListVo getMetadataSetList(RdfTripleLogSearchVo rdfTripleLogSearchVo) {
		log.debug("[RDF 트리플 로그 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			int totalListSize = rdfTripleLogMapper.selectRdfTripleLogCount(rdfTripleLogSearchVo);
			rdfTripleLogSearchVo.setTotalListSize(totalListSize);
			
			List<RdfTripleLogVo> list = rdfTripleLogMapper.selectRdfTripleLogList(rdfTripleLogSearchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(rdfTripleLogSearchVo));
			
		} catch (Exception e) {
			log.error("[RDF 트리플 로그 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[RDF 트리플 로그 목록 조회] 서비스 종료");
		return listVo;
	}
	
	/**
	 * RDF 트리플 로그 등록
	 * @Author      : heenim
	 * @Date        : 2023. 07. 24.
	 * @param rdfTripleLogVo
	 * @return
	 */
	@Transactional(transactionManager = "rdbTransactionManager", propagation = Propagation.REQUIRES_NEW)
	public int createRdfTripleLog(RdfTripleLogVo rdfTripleLogVo) {
//		log.debug("[RDF 트리플 로그 등록] 서비스 시작");
		int cnt = 0;
		
		try {
			String newId = ValueUtil.generateLogKey();
			rdfTripleLogVo.setRdfTripleLogId(newId);

			cnt = rdfTripleLogMapper.insertRdfTripleLog(rdfTripleLogVo);

		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[RDF 트리플 로그 등록] 코드그룹 등록 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[RDF 트리플 로그 등록] 코드그룹 등록 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
//		log.debug("[RDF 트리플 로그 등록] 서비스 종료");
		return cnt;
	}
	
	/**
	 * RDF 트리플 로그 목록 등록
	 * @Author      : heenim
	 * @Date        : 2023. 07. 24.
	 * @param rdfTripleLogVo
	 * @return
	 */
	@Transactional(transactionManager = "rdbTransactionManager", propagation = Propagation.REQUIRES_NEW)
	public int createRdfTripleLogList(List<RdfTripleLogVo> logList) {
//		log.debug("[RDF 트리플 로그 목록 등록] 서비스 시작");
		int cnt = 0;
		
		try {
			if (logList == null || logList.size() == 0) return 0;
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			
			String newId = "";
			int indexLen = (int)(Math.log10(logList.size()) + 1);
			for (int i = 0; i < logList.size(); i++) {
				newId = ValueUtil.generateLogKey(i, indexLen);
				logList.get(i).setRdfTripleLogId(newId);
				logList.get(i).setLogRegrId(loginUserVo.getUserId());
			}

			Map<String, Object> listMap = new HashMap<>();
			listMap.put("list", logList);
			cnt = rdfTripleLogMapper.insertRdfTripleLogList(listMap);

		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[RDF 트리플 로그 목록 등록] 코드그룹 등록 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[RDF 트리플 로그 목록 등록] 코드그룹 등록 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
//		log.debug("[RDF 트리플 로그 목록 등록] 서비스 종료");
		return cnt;
	}
	
}
