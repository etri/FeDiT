package kr.co.n2m.platform.meta.portal.countrycode.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.portal.countrycode.domain.CountryCodeSearchVo;
import kr.co.n2m.platform.meta.portal.countrycode.domain.CountryCodeVo;



@Mapper
public interface CountryCodeMapper {
	
	/** 국가코드 목록 건수 조회 */
	int selectCountryCodeCount(CountryCodeSearchVo searchVo);
	
	/** 국가코드 목록 조회 */
	List<CountryCodeVo> selectCountryCodeList(CountryCodeSearchVo searchVo);
	
	/** 국가코드 단일 조회 */
	CountryCodeVo selectCountryCode(CountryCodeVo countryCodeVo);
	
	/** 국가코드 등록 */
	int insertCountryCode(CountryCodeVo countryCodeVo);
	
	/** 국가코드 수정 */
	int updateCountryCode(CountryCodeVo countryCodeVo);
	
	/** 국가코드 중복확인 */
	boolean isDuplicatedCountryCode(CountryCodeVo countryCodeVo);
}
