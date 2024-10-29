package kr.co.n2m.platform.meta.portal.pat.service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.property.SecurityProperty;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.portal.pat.domain.PatCacheVo;
import kr.co.n2m.platform.meta.portal.pat.domain.PatSearchVo;
import kr.co.n2m.platform.meta.portal.pat.domain.PatVo;
import kr.co.n2m.platform.meta.portal.pat.mapper.PatMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class PatService {
	
	@Autowired
	private SecurityProperty property;
	
	@Autowired
	private PatMapper patMapper;
	
	SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
	
	/**
	 * PAT 목록 조회
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patSearchVo
	 * @return
	 */
	public SearchResultListVo getPatList(PatSearchVo patSearchVo) {
		log.debug("[PAT 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			int totalListSize = patMapper.selectPatCount(patSearchVo);
			patSearchVo.setTotalListSize(totalListSize);
			
			List<CamelCaseMap> list = patMapper.selectPatList(patSearchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(patSearchVo));
			
		} catch (Exception e) {
			log.error("[PAT 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[PAT 목록 조회] 서비스 종료");
		return listVo;
	}
	
	/**
	 * PAT 정보 조회
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patkId
	 * @return
	 */
	public PatVo getPat(String patkId) {
		log.debug("[PAT 조회] 서비스 시작");
		PatVo dto = null;
		
		try {
			PatVo vo = new PatVo();
			vo.setPatkId(patkId);
			dto = patMapper.selectPat(vo);

		} catch (Exception e) {
			log.error("[PAT 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[PAT 조회] 서비스 종료");
		return dto;
	}
	
	/**
	 * PAT 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patkId
	 * @return
	 */
	public int deletePat(String patkId) {
		log.debug("[PAT 삭제] 서비스 시작");
		int cnt = 0;
    	StringBuilder sb = new StringBuilder();	
    	
		try {
	    	// 필수 체크
	    	if (StringUtils.isBlank(patkId)) { sb.append("patkId").append(ValueUtil.required()).append("\n"); }
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
	    	
	    	PatVo dto = this.getPat(patkId);
	    	if (dto == null) throw new ResNotFoundException("해당 PAT가 존재하지 않습니다.");
	    	
	    	cnt = patMapper.deletePat(dto);

	    	this.removePatCache(patkId);
	    	
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[PAT 삭제] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[PAT 삭제] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
	
		log.debug("[PAT 삭제] 서비스 종료");
		return cnt;		
	}
	
	/**
	 * PAT 등록
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patVo
	 * @return
	 */
	public String createPat(PatVo patVo) {
		log.debug("[PAT 등록] 서비스 시작");
		StringBuilder sb = new StringBuilder();	
		try {
			// 필수 체크
	    	if (StringUtils.isBlank(patVo.getToknNm())) { sb.append("toknNm").append(ValueUtil.required()).append("\n"); }
	    	
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			patVo.setPatkRegrId(loginUserVo.getUserId());
			patVo.setPatkRegrNm(loginUserVo.getUserNm());
			
			patVo.setPatkId(patMapper.selectPatKey());
			
			String tokn = createJwtToken(patVo);
			patVo.setToknVal(tokn);
						
			patMapper.insertPat(patVo);
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[PAT 등록] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;				
		}  catch (Exception e) {
			log.error("[PAT 등록] 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}
		log.debug("[PAT 등록] 서비스 종료");
		return patVo.getPatkId();
	}
	
	/**
	 * PAT 정보 조회 (Cache)
	 * @Author      : tklee
	 * @Date        : 2024. 02. 14.
	 * @param patkId
	 * @return
	 */
	@Cacheable(cacheNames="patInfo", key="#patkId", unless="#result == null")
	public PatCacheVo getPatCache(String patkId) {
		log.debug("[PAT 조회 (Cache)] 서비스 시작");
		PatCacheVo casheVo = null;
		
		try {
			PatVo vo = new PatVo();
			vo.setPatkId(patkId);
			PatVo dto = patMapper.selectPat(vo);
			
			if(dto != null) {
				casheVo = new PatCacheVo();
				Date now = new Date();
				casheVo.setPatCacheInqDate(formatter.format(now));
				casheVo.setPatkId(dto.getPatkId());
				casheVo.setPatkRegDt(dto.getPatkRegDt());
				casheVo.setPatkRegrId(dto.getPatkRegrId());
				casheVo.setPatkRegrNm(dto.getPatkRegrNm());
				casheVo.setToknExpDate(dto.getToknExpDate());
				casheVo.setToknNm(dto.getToknNm());
				casheVo.setToknVal(dto.getToknVal());
			}

		} catch (Exception e) {
			log.error("[PAT 조회 (Cache)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[PAT 조회 (Cache)] 서비스 종료");
		return casheVo;
	}
	
    /**
     * Cache에 저장된 PAT 정보 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 02. 14.
	 * @param patkId
     */
	@CacheEvict(cacheNames="patInfo", key="#patkId", beforeInvocation=false, allEntries=false)
	public void removePatCache(String patkId) {
		log.info("Remove Pat info.");
	}	
	
	
	
	/** JWT 토큰 생성 */
	public String createJwtToken(PatVo patVo) {
	    Date now = new Date();
	    Date exp = null;
		try {
			if(!StringUtils.isBlank(patVo.getToknExpDate())) {				
				exp = formatter.parse(patVo.getToknExpDate());
			}
		} catch (ParseException e) {
			e.printStackTrace();
		}
		
	    // header
	    Map<String, Object> header = new HashMap<>();
	    header.put("alg", "HS256"); // 알고리즘	    
	    header.put("typ", "JWT");	// 토큰 타입   
		
		// claims : payload (보안이 필요한 데이터는 넣으면 안됨)
	    Claims claims = Jwts.claims().setSubject(patVo.getPatkId()); // JWT payload 에 저장되는 정보단위
	    // 정보는 key / value 쌍으로 저장된다.
	    claims.put("toknExpDate"       , patVo.getToknExpDate());
	    claims.put("patkRegrId"       , patVo.getPatkRegrId());
	    claims.put("patkRegrNm"       , patVo.getPatkRegrNm());
	    
	    String token = Jwts.builder()
	    		.setHeader(header)
	    		.setClaims(claims) 
	    		.setIssuer("keti_dt_metadata_api")	            
	    		.setIssuedAt(now) // 토큰 발행 시간 정보 iat
	    		.setExpiration(exp) 
	    		.signWith(property.getSecretKey(), SignatureAlgorithm.HS256)
	    		.compact();

	    return token;	    
	}
	
}
