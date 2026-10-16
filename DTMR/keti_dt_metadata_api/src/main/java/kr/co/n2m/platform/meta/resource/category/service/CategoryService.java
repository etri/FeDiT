package kr.co.n2m.platform.meta.resource.category.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.property.DtmetaProperty;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.rdf.rdfclass.domain.RdfClassDto;
import kr.co.n2m.platform.meta.rdf.virtuoso.service.VirtuosoService;
import kr.co.n2m.platform.meta.resource.category.domain.CategorySearchVo;
import kr.co.n2m.platform.meta.resource.category.domain.CategoryVo;
import kr.co.n2m.platform.meta.resource.category.mapper.CategoryMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class CategoryService {

	@Autowired
	private CategoryMapper categoryMapper;

	@Autowired
	DtmetaProperty dtmetaProperty;
	
	private VirtuosoService virtuosoService; // 순환참조 오류 방지
	
	public void setVirtuosoService(VirtuosoService virtuosoService) { // 순환참조 오류 방지
		this.virtuosoService = virtuosoService;
	}
	
	private final String CREATE_MODE = "Create";
	private final String UPDATE_MODE = "Update";
	private final String DUPLICATED = "duplicated";

	
	/**
	 * 카테고리 목록 조회
	 * @Author      : solee
	 * @Date        : 2023. 04. 26.
	 * @param categorySearchVo
	 * @return
	 */
	public SearchResultListVo getCategoryList(CategorySearchVo searchVo) {
		log.debug("[카테고리 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			
			int totalListSize = categoryMapper.selectCategoryCount(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<CategoryVo> list = categoryMapper.selectCategoryList(searchVo);
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
		} catch (Exception e) {
			log.error("[카테고리 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);	
		}
		
		return listVo;
	}
	
	/**
	 * 카테고리 상세 조회
	 * @Author      : solee
	 * @Date        : 2023. 04. 26.
	 * @param agentSearchVo
	 * @return
	 */	
	public CategoryVo getCategory(String ctgryId) {
		log.debug("[카테고리 상세 조회] 서비스 시작");
		CategoryVo vo = null;
		
		try {
		
			CategoryVo paramVo = new CategoryVo();
			paramVo.setCtgryId(ctgryId);
			vo = categoryMapper.selectCategory(paramVo);
			
		} catch (Exception e) {
			log.error("[카테고리 상세 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[카테고리 상세 조회] 서비스 종료");
		return vo;
	}
	
	/**
	 * 카테고리 등록
	 * @Author      : solee
	 * @Date        : 2023. 04. 26.
	 * @param categoryVo
	 * @return
	 */		
	public String createCategory(CategoryVo categoryVo) {
		log.debug("[카테고리 등록] 서비스 시작");
		
		try {
			
			categoryFormValidation(categoryVo , CREATE_MODE);
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			categoryVo.setCtgryRegrId(loginUserVo.getUserId());
			categoryVo.setCtgryRegrNm(loginUserVo.getUserNm());
			categoryVo.setCtgryAmdrId(loginUserVo.getUserId());
			categoryVo.setCtgryAmdrNm(loginUserVo.getUserNm());
			
			// 1. 등록
			categoryMapper.insertCategoryAutoKey(categoryVo);
			
			// 2. 등록 후 버투소에 등록
			this.saveToVirtuoso(categoryVo.getCtgryId(), loginUserVo.getUserId());
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[카테고리 등록] 카테고리 등록 실패/오류 (정보성) : {}", e.getMessage());
			throw e;						
		} catch (Exception e) {
			log.error("[카테고리 등록] 카테고리 등록 실패/오류", e);
			throw new ResBaseRuntimeException(e);				
		}
		
		log.debug("[카테고리 등록] 서비스 종료");
		return categoryVo.getCtgryId();
	}
	
	/**
	 * 카테고리 수정
	 * @Author      : solee
	 * @Date        : 2023. 04. 26.
	 * @param categoryVo
	 * @return
	 */	
	public void modifyCategory(CategoryVo categoryVo) {
		log.debug("[카테고리 수정] 서비스 시작");
		
		try {
			
			categoryFormValidation(categoryVo, UPDATE_MODE);
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			categoryVo.setCtgryAmdrId(loginUserVo.getUserId());
			categoryVo.setCtgryAmdrNm(loginUserVo.getUserNm());			
			
			// 1. 수정 전 버투소에서 기존 카테고리 정보 삭제
			String Iri = dtmetaProperty.getRdfSchemaSkosUrl() + categoryVo.getCtgryRdfCncptNm();
			this.deleteFromVirtuoso(Iri, loginUserVo.getUserId());
			
			// 2. 수정
			categoryMapper.updateCategory(categoryVo);
			
			// 3. 수정 후 버투소에 등록
			this.saveToVirtuoso(categoryVo.getCtgryId(), loginUserVo.getUserId());
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[카테고리 수정] 카테고리 수정 실패/오류 (정보성) : {}", e.getMessage());
			throw e;					
		} catch (Exception e) {
			log.error("[카테고리 수정] 카테고리 수정 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}
		
		log.debug("[카테고리 수정] 서비스 종료");
	}
	
	/**
	 * 카테고리 삭제
	 * @Author      : solee
	 * @Date        : 2023. 04. 26.
	 * @param categoryVo
	 * @return
	 */	
	public void deleteCategory(String ctgryId) {
		log.debug("[카테고리 삭제] 서비스 시작");
		
		try {
			
			StringBuffer sb = new StringBuffer();
			
			//필수 check
			if (StringUtils.isBlank(ctgryId)) { sb.append("ctgryId").append(ValueUtil.required()).append("\n"); }

			if (sb.length() > 0) throw new ResBadRequestException(sb.toString());

			//data check
			CategoryVo paramVo = new CategoryVo();
			paramVo.setCtgryId(ctgryId);
			
			CategoryVo delVo = categoryMapper.selectCategory(paramVo);
			if (delVo == null) throw new ResBadRequestException("카테고리 데이터가 존재하지 않습니다.");
			
			//상위카테고리 여부 check (delete prevent)
			boolean isUpperCategory = categoryMapper.selectIsUpperCategory(delVo);
			if (isUpperCategory) {
				throw new ResBizInfoException("하위에 카테고리들이 존재하기 떄문에 삭제할 수 없습니다.");
			}
			
			// 1. 삭제 전 버투소에서 카테고리 정보 삭제
			String Iri = dtmetaProperty.getRdfSchemaSkosUrl() + delVo.getCtgryRdfCncptNm();
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			this.deleteFromVirtuoso(Iri, loginUserVo.getUserId());
			
			// 2. 삭제
			//delete or state update check
			boolean isMetaModelExist = categoryMapper.selectMetaDataByCategory(delVo);
			if (isMetaModelExist) {
				delVo.setCtgryDataSttusMtcd("disuse");
				categoryMapper.updateCategoryStatus(delVo);
			} else {
				categoryMapper.deleteCategory(delVo);
			}
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[카테고리 삭제] 대리인 삭제 실패/오류 (정보성) : {}", e.getMessage());
			throw e;	
		} catch (Exception e) {
			log.error("[카테고리 삭제] 대리인 삭제 실패/오류", e);
		}
	}
		
	/**
	 * 카테고리 VO validation
	 * */
	private void categoryFormValidation(CategoryVo categoryVo, String modeType) {
		
		StringBuffer sb = new StringBuffer();
		
		//필수 check
		if (StringUtils.isBlank(categoryVo.getCtgryNm())) { sb.append("ctgryNm").append(ValueUtil.required()).append("\n"); }
		if (UPDATE_MODE.equals(modeType) && StringUtils.isBlank(categoryVo.getCtgryId())) {
			sb.append("ctgryId").append(ValueUtil.required()).append("\n");		
		}
		if (UPDATE_MODE.equals(modeType) && StringUtils.isBlank(categoryVo.getCtgryDataSttusMtcd())) {
			sb.append("ctgryDataSttusMtcd").append(ValueUtil.required()).append("\n");
		}
		if((Integer)categoryVo.getCtgrySortOdrg() != null) {
			if (categoryVo.getCtgrySortOdrg() < 0 || categoryVo.getCtgrySortOdrg() > 99999) { sb.append("ctgrySortOdrg").append(ValueUtil.mustBeBetween("0","99999")).append("\n"); }
		}
		
		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
		
		//기존 참조 data check
		//TODO: enum 화 
		if (!StringUtils.isBlank(categoryVo.getCntryCd())) {
			boolean isValidCntryCd = categoryMapper.selectCountryCodeByCntryCd(categoryVo);
			if (!isValidCntryCd) {
				throw new ResBizInfoException("존재하지 않는 국가코드입니다.");
			}
		}
		
		//default value set
		if (StringUtils.isBlank(categoryVo.getCtgryDataSttusMtcd())) {
			categoryVo.setCtgryDataSttusMtcd("use");
		}
		if((Integer)categoryVo.getCtgrySortOdrg() == null) {
			categoryVo.setCtgrySortOdrg(0);
		}
		// 카테고리 RDF 개념명 중복확인
		Map<String, Boolean> map = isCtgryRdfCncptNmExist(categoryVo.getCtgryRdfCncptNm(), categoryVo.getCtgryId());
		if(map.get(DUPLICATED) == true){
			throw new ResBadRequestException("카테고리 RDF 개념명이 중복되어 등록(수정)이 불가능합니다.");
		}
	}
	
	/**
	 * 카테고리명 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 12.
	 * @param categoryId
	 * @return nullable
	 */
	public String getCategoryName(String categoryId) {
		// TODO: 추후 캐시 조회 작업이 필요할 수 있음	
		if (StringUtils.isBlank(categoryId)) return null;
		CategoryVo categoryVo = this.getCategory(categoryId);
		if (categoryVo != null) {
			return categoryVo.getCtgryNm();
		} else {
			return null;
		}
	}

	/**
	 * 카테고리명 조회 (By 카테고리 RDF 개념명)
	 * @Author      : Ran
	 * @Date        : 2023. 10. 19.
	 * @param ctgryRdfCncptNm
	 * @return nullable
	 */
	public String getCategoryNameByConcept(String ctgryRdfCncptNm) {
		if (StringUtils.isBlank(ctgryRdfCncptNm)) return null;
		CategoryVo searchVo = new CategoryVo();
		searchVo.setCtgryRdfCncptNm(ctgryRdfCncptNm);
		CategoryVo categoryVo = categoryMapper.selectCategoryByConcept(searchVo);
		if (categoryVo != null) {
			return categoryVo.getCtgryNm();
		} else {
			return null;
		}
	}

	/**
	 * 카테고리 RDF 개념 명 중복 조회
	 * @Author      : Ran
	 * @Date        : 2023. 10. 18.
	 * @param ctgryRdfCncptNm
	 * @param ctgryId
	 * @return
	 */
	public Map<String, Boolean> isCtgryRdfCncptNmExist(String ctgryRdfCncptNm, String ctgryId) {
		log.debug("[카테고리 RDF 개념 명 중복 조회] 서비스 시작");
		Map<String, Boolean> resMap = new HashMap<>();
		CategorySearchVo searchVo = new CategorySearchVo();
		searchVo.setCtgryId(ctgryId);	// 등록: null, 수정: notnull
		searchVo.setCtgryRdfCncptNm(ctgryRdfCncptNm);
		try {
			boolean isIdDuplicated = categoryMapper.isCtgryRdfCncptNmExist(searchVo);
			resMap.put(DUPLICATED, isIdDuplicated);
		} catch (Exception e) {
			log.error("[카테고리 RDF 개념 명 중복 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[카테고리 RDF 개념 명 중복 조회] 서비스 종료");
		return resMap;
	}
	
    /**
     * 카테고리 정보를 버투소 그래프 DB에 반영 (ketidtskos)
	 * @Author      : tklee
	 * @Date        : 2023. 11. 14.
     * @param rdfClassId
     * @param logRegrId
     */
    private void saveToVirtuoso(String ctgryId, String logRegrId) {
    	String logIri = ctgryId;
    	CategoryVo vo = null;
		try {
			CategoryVo paramVo = new CategoryVo();
			paramVo.setCtgryId(ctgryId);
			vo = categoryMapper.selectCategory(paramVo);
			
			if (vo != null) {
				logIri = dtmetaProperty.getRdfSchemaSkosUrl() + vo.getCtgryRdfCncptNm();
				virtuosoService.saveRdfSkosToGraphByUriForUse(logIri, logRegrId);
			}
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.error("[RDF 클래스 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) : {} - {}", logIri, e.getReason());
		} catch (Exception e) {
			log.error("[RDF 클래스 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) - {}", logIri, e);
		}
    }
    
    /**
     * 카테고리 정보를 버투소 그래프 DB에서 삭제 (ketidtskos)
	 * @Author      : tklee
	 * @Date        : 2023. 11. 14.
     * @param iri
     * @param logRegrId
     * @return
     */
    private boolean deleteFromVirtuoso(String Iri, String logRegrId) {
    	boolean bDeleted = false;
		try {
			if (Iri != null) {
				virtuosoService.deleteRdfSkosToGraphByUriForUse(Iri, logRegrId);
				bDeleted = true;
			}
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.error("[RDF 클래스 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) : {} - {}", Iri, e.getReason());
		} catch (Exception e) {
			log.error("[RDF 클래스 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) - {}", Iri, e);
		}
		return bDeleted;
    }
}
