package kr.co.n2m.platform.meta.resource.category.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.resource.category.domain.CategorySearchVo;
import kr.co.n2m.platform.meta.resource.category.domain.CategoryVo;

@Mapper
public interface CategoryMapper {
	
	/** 카테고리 관리 목록 건수 조회 */
	int selectCategoryCount(CategorySearchVo searchVo);
	
	/** 카테고리 관리 목록 조회 */
	List<CategoryVo> selectCategoryList(CategorySearchVo searchVo);
	
	/** 카테고리 단일 조회 */
	CategoryVo selectCategory(CategoryVo categoryVo);

	/** 카테고리명 조회 (By 카테고리 RDF 개념명) */
	CategoryVo selectCategoryByConcept(CategoryVo categoryVo);

	/** 카테고리 등록 - 자동생성 key */
	int insertCategoryAutoKey(CategoryVo categoryVo);
	
	/** 카테고리 수정 */
	int updateCategory(CategoryVo categoryVo);
	
	/** 카테고리 삭제 */
	int deleteCategory(CategoryVo categoryVo);
	
	/** 카테고리 상태 수정 (medata_set_sttus_mtcd : disuse) */
	int updateCategoryStatus(CategoryVo categoryVo);
	
	/** 메타데이터 내 카테고리 data 존재 여부 확인 */
	boolean selectMetaDataByCategory(CategoryVo categoryVo);
	
	/** 국가코드 데이터 존재여부 확인 */
	boolean selectCountryCodeByCntryCd(CategoryVo categoryVo);
	
	/** 상위카테고리 여부 확인 */
	boolean selectIsUpperCategory(CategoryVo categoryVo);

	/**	카테고리 RDF 개념 명 중복 조회 */
	boolean isCtgryRdfCncptNmExist(CategorySearchVo searchVo);
}
