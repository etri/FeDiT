package kr.co.n2m.platform.meta.portal.countrycode.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apicatalog.jsonld.StringUtils;

import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.portal.countrycode.domain.CountryCodeSearchVo;
import kr.co.n2m.platform.meta.portal.countrycode.domain.CountryCodeVo;
import kr.co.n2m.platform.meta.portal.countrycode.mapper.CountryCodeMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class CountryCodeService {
	
	@Autowired
	private CountryCodeMapper countryCodeMapper;
	
	private final String CREATE_MODE = "Create";
	private final String UPDATE_MODE = "Update";
	
	/**
	 * 국가코드 목록 조회
	 * @Author      : solee
	 * @Date        : 2023. 04. 27.
	 * @param CountryCodeSearchVo
	 * @return
	 */	
	public SearchResultListVo getCountryCodeList(CountryCodeSearchVo searchVo) {
		log.debug("[국가코드 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
					
			int totalListSize = countryCodeMapper.selectCountryCodeCount(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<CountryCodeVo> list = countryCodeMapper.selectCountryCodeList(searchVo);
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));

		} catch (Exception e) {
			log.error("[국가코드 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);				
		}
		
		log.debug("[국가코드 목록 조회] 서비스 종료");
		return listVo;
	}
	
	/**
	 * 국가코드 상세 조회
	 * @Author      : solee
	 * @Date        : 2023. 04. 27.
	 * @param CountryCodeSearchVo
	 * @return
	 */	
	public CountryCodeVo getCountryCode(String cntryCd) {
		log.debug("[국가코드 상세 조회] 서비스 시작");
		CountryCodeVo vo = null;
		
		try {
			
			CountryCodeVo paramVo = new CountryCodeVo();
			paramVo.setCntryCd(cntryCd);
			vo = countryCodeMapper.selectCountryCode(paramVo);
			
		} catch (Exception e) {
			log.error("[국가코드 상세 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}
		
		log.debug("[국가코드 상세 조회] 서비스 종료");
		return vo;
	}
	
	/**
	 * 국가코드 등록
	 * @Author      : solee
	 * @Date        : 2023. 06. 28.
	 * @param CountryCodeVo
	 * @return
	 */
	public String createCountryCode(CountryCodeVo countryCodeVo) {
		log.debug("[국가코드 등록] 서비스 시작");
		try {
			countryCodeFormValidation(countryCodeVo, CREATE_MODE);
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			countryCodeVo.setCntryRegrId(loginUserVo.getUserId());
			countryCodeVo.setCntryRegrNm(loginUserVo.getUserNm());
			countryCodeVo.setCntryAmdrId(loginUserVo.getUserId());
			countryCodeVo.setCntryAmdrNm(loginUserVo.getUserNm());
			countryCodeMapper.insertCountryCode(countryCodeVo);
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[국가코드 등록] 국가코드 등록 실패/오류 (정보성) : {}", e.getMessage());
			throw e;				
		}  catch (Exception e) {
			log.error("[국가코드 등록] 국가코드 등록 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}
		log.debug("[국가코드 등록] 서비스 종료");
		return countryCodeVo.getCntryCd();
	}
	
	/**
	 * 국가코드 수정
	 * @Author      : solee
	 * @Date        : 2023. 06. 29.
	 * @param CountryCodeVo
	 * @return
	 */
	public void modifyCountryCode(CountryCodeVo countryCodeVo) {
		log.debug("[국가코드 수정] 서비스 시작");
		try {
			countryCodeFormValidation(countryCodeVo, UPDATE_MODE);
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			countryCodeVo.setCntryRegrId(loginUserVo.getUserId());
			countryCodeVo.setCntryRegrNm(loginUserVo.getUserNm());
			countryCodeVo.setCntryAmdrId(loginUserVo.getUserId());
			countryCodeVo.setCntryAmdrNm(loginUserVo.getUserNm());			
			countryCodeMapper.updateCountryCode(countryCodeVo);
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[국가코드 수정] 국가코드 수정 실패/오류 (정보성) : {}", e.getMessage());
			throw e;					
		} catch (Exception e) {
			log.error("[국가코드 수정] 국가코드 수정 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}
		log.debug("[국가코드 수정] 서비스 종료");
	}
	
	private void countryCodeFormValidation(CountryCodeVo countryCodeVo, String modeType) {	
		
		StringBuffer sb = new StringBuffer();		
		//필수 check
		if (StringUtils.isBlank(countryCodeVo.getCntryCd())) { sb.append("cntryCd").append(ValueUtil.required()).append("\n"); }
		if (StringUtils.isBlank(countryCodeVo.getCntryNm())) { sb.append("cntryNm").append(ValueUtil.required()).append("\n"); }
		if (UPDATE_MODE.equals(modeType) && StringUtils.isBlank(countryCodeVo.getCntryDataSttusMtcd())) {
			sb.append("cntryDataSttusMtcd").append(ValueUtil.required()).append("\n");
		}
		
		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
		
		// 중복 check
		if (CREATE_MODE.equals(modeType)) {
			boolean isDuplicatedCountryCode = countryCodeMapper.isDuplicatedCountryCode(countryCodeVo);
			if (isDuplicatedCountryCode) {
				throw new ResBizInfoException("이미 등록된 국가코드 입니다.");
			}			
		}
		
		//default value set
		if (StringUtils.isBlank(countryCodeVo.getCntryDataSttusMtcd())) {
			countryCodeVo.setCntryDataSttusMtcd("use");
		}
	}
	
	public Map<String, Boolean> checkCountrycode(CountryCodeVo countryCodeVo) {
		log.debug("[국가코드 중복조회] 서비스 시작");
		Map<String, Boolean> resMap = new HashMap<>();
		
		try {
			boolean isDuplicatedCountryCode = countryCodeMapper.isDuplicatedCountryCode(countryCodeVo);
			resMap.put("duplicated", isDuplicatedCountryCode);
			log.debug("[국가코드 중복조회] 성공");
		} catch (Exception e) {
			log.error("[국가코드 중복조회] 국가코드 중복조회 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[국가코드 중복조회] 서비스 종료");
		return resMap;
	}
}
