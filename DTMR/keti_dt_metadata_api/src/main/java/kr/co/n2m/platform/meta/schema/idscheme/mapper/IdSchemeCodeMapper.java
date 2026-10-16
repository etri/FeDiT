package kr.co.n2m.platform.meta.schema.idscheme.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.schema.idscheme.domain.IdSchemeCodeDto;
import kr.co.n2m.platform.meta.schema.idscheme.domain.IdSchemeSearchVo;
import kr.co.n2m.platform.meta.schema.idscheme.domain.IdSchemeCodeVo;

@Mapper
public interface IdSchemeCodeMapper {
	
	/** 식별체계 - 표준산업분류체계 코드 건수 조회 */
	int selectIdSchemeStdIndCount(IdSchemeSearchVo searchVo);
	
	/** 식별체계 - 표준산업분류체계 코드 목록 조회 */
	List<IdSchemeCodeDto> selectIdSchemeStdIndList(IdSchemeSearchVo searchVo);

	/** 식별체계 - 표준산업분류체계 코드 대분류 외부 코드 목록 조회 */
	List<IdSchemeCodeDto> selectIdSchemeStdIndLctgCodeList();
	
	/** 식별체계 - 표준산업분류체계 코드 조회 */
	IdSchemeCodeDto selectIdSchemeStdInd(IdSchemeCodeVo idSchemeCodeVo);
	
	/** 식별체계 - 표준산업분류체계 코드 등록 */
	int insertIdSchemeStdInd(IdSchemeCodeVo idSchemeCodeVo);
	
	/** 식별체계 - 표준산업분류체계 코드 수정 */
	int updateIdSchemeStdInd(IdSchemeCodeVo idSchemeCodeVo);
	
	
	
	/** 식별체계 - 공공자원분류체계 코드 건수 조회 */
	int selectIdSchemePubRiCount(IdSchemeSearchVo searchVo);
	
	/** 식별체계 - 공공자원분류체계 코드 목록 조회 */
	List<IdSchemeCodeDto> selectIdSchemePubRiList(IdSchemeSearchVo searchVo);

	/** 식별체계 - 공공자원분류체계 코드 대분류 외부 코드 목록 조회 */
	List<IdSchemeCodeDto> selectIdSchemePubRiLctgCodeList();
	
	/** 식별체계 - 공공자원분류체계 코드 조회 */
	IdSchemeCodeDto selectIdSchemePubRi(IdSchemeCodeVo idSchemeVo);
	
	/** 식별체계 - 공공자원분류체계 코드 등록 */
	int insertIdSchemePubRi(IdSchemeCodeVo idSchemeVo);
	
	/** 식별체계 - 공공자원분류체계 코드 수정 */
	int updateIdSchemePubRi(IdSchemeCodeVo idSchemeVo);
	
	
	
	/** 식별체계 - 객체 - 물품 코드 건수 조회 */
	int selectIdSchemeProductCount(IdSchemeSearchVo searchVo);
	
	/** 식별체계 - 객체 - 물품 코드 목록 조회 */
	List<IdSchemeCodeDto> selectIdSchemeProductList(IdSchemeSearchVo searchVo);
	
	/** 식별체계 - 객체 - 물품 코드 조회 */
	IdSchemeCodeDto selectIdSchemeProduct(IdSchemeCodeVo idSchemeVo);
	
	/** 식별체계 - 객체 - 물품 코드 등록 */
	int insertIdSchemeProduct(IdSchemeCodeVo idSchemeVo);
	
	/** 식별체계 - 객체 - 물품 코드 수정 */
	int updateIdSchemeProduct(IdSchemeCodeVo idSchemeVo);
	
	
	
	/** 식별체계 - 객체 - 시설 코드 건수 조회 */
	int selectIdSchemeFacilityCount(IdSchemeSearchVo searchVo);
	
	/** 식별체계 - 객체 - 시설 코드 목록 조회 */
	List<IdSchemeCodeDto> selectIdSchemeFacilityList(IdSchemeSearchVo searchVo);
	
	/** 식별체계 - 객체 - 시설 코드 조회 */
	IdSchemeCodeDto selectIdSchemeFacility(IdSchemeCodeVo idSchemeVo);
	
	/** 식별체계 - 객체 - 시설 코드 등록 */
	int insertIdSchemeFacility(IdSchemeCodeVo idSchemeVo);
	
	/** 식별체계 - 객체 - 시설 코드 수정 */
	int updateIdSchemeFacility(IdSchemeCodeVo idSchemeVo);
	
	
	
	// TODO 한번에 조회 할 수도 있음... 모든 테이블 UNION ???
	
	/** 식별체계 - 객체 -지형지물 코드 건수 조회 */
	int selectIdSchemeFeatureCount(IdSchemeSearchVo searchVo);
	
	/** 식별체계 - 객체 - 지형지물 코드 목록 조회 */
	List<IdSchemeCodeDto> selectIdSchemeFeatureList(IdSchemeSearchVo searchVo);
	
	/** 식별체계 - 객체 - 지형지물 코드 조회 */
	IdSchemeCodeDto selectIdSchemeFeature(IdSchemeCodeVo idSchemeVo);
	
	/** 식별체계 - 객체 - 지형지물 코드 중복 존재 여부 조회 */
	boolean isIdSchemeFeatureExists(IdSchemeSearchVo searchVo);
	
	/** 식별체계 - 객체 - 지형지물 코드 등록 */
	int insertIdSchemeFeature(IdSchemeCodeVo idSchemeCodeVo);
	
	/** 식별체계 - 객체 - 지형지물 코드 수정 */
	int updateIdSchemeFeature(IdSchemeCodeVo idSchemeCodeVo);
	
}
