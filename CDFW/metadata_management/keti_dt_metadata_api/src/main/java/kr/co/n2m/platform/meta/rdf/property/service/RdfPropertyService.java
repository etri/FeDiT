package kr.co.n2m.platform.meta.rdf.property.service;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
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
import kr.co.n2m.platform.meta.rdf.mapping.service.RdfMappingService;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyDefineDto;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyDefineSearchVo;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyDefineVo;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyDto;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertySearchVo;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyVo;
import kr.co.n2m.platform.meta.rdf.property.mapper.RdfPropertyMapper;
import kr.co.n2m.platform.meta.rdf.rdfclass.mapper.RdfClassMapper;
import kr.co.n2m.platform.meta.rdf.virtuoso.service.VirtuosoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(transactionManager = "rdbTransactionManager")
public class RdfPropertyService {

	private final RdfPropertyMapper rdfPropertyMapper;

	private final RdfClassMapper rdfClassMapper;

	private final RdfMappingService rdfMappingService;

	private final DtmetaProperty dtmetaProperty;

	private VirtuosoService virtuosoService; // 순환참조 오류 방지
	
	public void setVirtuosoService(VirtuosoService virtuosoService) { // 순환참조 오류 방지
		this.virtuosoService = virtuosoService;
	}

	void validate(RdfPropertyVo rdfPropertyVo, boolean deleteModeYn) {
		/***************************************** 유효성 검사 - 삭제 *****************************************/
		if (deleteModeYn) {
			boolean errorYn = rdfPropertyMapper.validationDuringDeleteMode(rdfPropertyVo.getRdfPrptyId());
			if (errorYn) {
				throw new ResBizInfoException("RDF 프라퍼티 정의, RDF 매핑규칙에 사용중이어서 RDF 프라퍼티를 삭제할 수 없습니다.");
			}
			return;
		}
		/***************************************** 유효성 검사 - 등록 or 수정 *****************************************/
		// 1. Null
		StringBuffer sb = new StringBuffer();
		if (StringUtils.isBlank(rdfPropertyVo.getRdfPrptyNm())) {
			sb.append("rdfPrptyNm").append(ValueUtil.required()).append("\n");
		}
		if (StringUtils.isBlank(rdfPropertyVo.getRdfNmspId())) {
			sb.append("rdfNmspId").append(ValueUtil.required()).append("\n");
		}
		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());

		// 2. RDF 네임스페이스
		boolean rdfNmspIdExistYn = rdfClassMapper.isRdfNmspIdExist(rdfPropertyVo.getRdfNmspId());
		if (!rdfNmspIdExistYn) {
			throw new ResBizInfoException("존재하는 RDF 네임스페이스 ID(" + rdfPropertyVo.getRdfNmspId() + ")가 아닙니다.");
		}
		// 3. 중복 확인
		boolean errorYn = rdfPropertyMapper.validationDuringEditMode(rdfPropertyVo);
		if (errorYn) {
			throw new ResBizInfoException("RDF 프라퍼티명(" + rdfPropertyVo.getRdfPrptyNm() + ")과  RDF 네임스페이스 ID("
					+ rdfPropertyVo.getRdfNmspId() + ")가 동일한 RDF 프라퍼티가 존재하여 저장할 수 없습니다.");
		}
	}

	/**
	 * RDF 프라퍼티 목록 조회
	 * RDF 클래스 상세 조회 시 RDF 프라퍼티 목록 조회 (rdfClassId 일치 & domn_range_div_mtcd ='domain')
	 * @param rdfPropertySearchVo
	 * @return
	 * @Author : Ran
	 * @Date : 2023. 07. 05.
	 */
	public SearchResultListVo getRdfPropertyList(RdfPropertySearchVo rdfPropertySearchVo) {
		log.debug("[RDF 프라퍼티 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		try {
			int totalListSize;
			List<RdfPropertyDto> list;
			if ("domain".equals(rdfPropertySearchVo.getSearchMode())) {
				totalListSize = rdfPropertyMapper.selectDomainRdfPropertyCount(rdfPropertySearchVo);
				rdfPropertySearchVo.setTotalListSize(totalListSize);
				list = rdfPropertyMapper.selectDomainRdfPropertyList(rdfPropertySearchVo);
			} else {
				totalListSize = rdfPropertyMapper.selectRdfPropertyCount(rdfPropertySearchVo);
				rdfPropertySearchVo.setTotalListSize(totalListSize);
				list = rdfPropertyMapper.selectRdfPropertyList(rdfPropertySearchVo);
			}
			listVo.setList(list);
			listVo.setPage(new PageVo(rdfPropertySearchVo));
		} catch (Exception e) {
			log.error("[RDF 프라퍼티 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 프라퍼티 목록 조회] 서비스 종료");
		return listVo;
	}

	/**
	 * RDF 프라퍼티 상세 조회
	 *
	 * @param rdfPrptyId
	 * @return
	 * @Author : Ran
	 * @Date : 2023. 07. 05.
	 */
	public RdfPropertyDto getRdfPropertyDetail(String rdfPrptyId) {
		log.debug("[RDF 프라퍼티 상세 조회] 서비스 시작");
		RdfPropertyDto rdfProperty = null;
		try {
			RdfPropertyVo paramVo = new RdfPropertyVo();
			paramVo.setRdfPrptyId(rdfPrptyId);
			rdfProperty = rdfPropertyMapper.selectRdfProperty(paramVo);
		}catch (Exception e) {
			log.error("[RDF 프라퍼티 상세 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 프라퍼티 상세 조회] 서비스 종료");
		return rdfProperty;
	}

	/**
	 * RDF 프라퍼티 등록
	 *
	 * @param rdfPropertyVo
	 * @return
	 * @Author : Ran
	 * @Date : 2023. 07. 05.
	 */
	public String createRdfProperty(RdfPropertyVo rdfPropertyVo) {
		log.debug("[RDF 프라퍼티 등록] 서비스 시작");
		try {
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			rdfPropertyVo.setRdfPrptyRegrId(loginUserVo.getUserId());
			rdfPropertyVo.setRdfPrptyRegrNm(loginUserVo.getUserNm());
			rdfPropertyVo.setRdfPrptyAmdrId(loginUserVo.getUserId());
			rdfPropertyVo.setRdfPrptyAmdrNm(loginUserVo.getUserNm());

			validate(rdfPropertyVo, false);

			// 1. 등록
			rdfPropertyMapper.insertRdfProperty(rdfPropertyVo);

			// 2. 디지털트윈 네임스페이스 경우 버투소 등록
			this.saveToVirtuoso(rdfPropertyVo.getRdfPrptyId(), loginUserVo.getUserId());

		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[RDF 프라퍼티 등록] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[RDF 프라퍼티 등록] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 프라퍼티 등록] 서비스 종료");
		return rdfPropertyVo.getRdfPrptyId();
	}

	/**
	 * RDF 프라퍼티 수정
	 *
	 * @param rdfPropertyVo
	 * @return
	 * @Author : Ran
	 * @Date : 2023. 07. 05.
	 */
	public String modifyRdfProperty(RdfPropertyVo rdfPropertyVo) {
		log.debug("[RDF 프라퍼티 수정] 서비스 시작");
        LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
        
		try {
			rdfPropertyVo.setRdfPrptyAmdrId(loginUserVo.getUserId());
			rdfPropertyVo.setRdfPrptyAmdrNm(loginUserVo.getUserNm());

			validate(rdfPropertyVo, false);

			// 1. 수정 전 디지털트윈 네임스페이스 경우 버투소에서 삭제
			RdfPropertyDto prevRdfPropertyDto = rdfPropertyMapper.selectRdfProperty(rdfPropertyVo);
        	if (prevRdfPropertyDto != null 
        		&& (!StringUtils.equals(prevRdfPropertyDto.getRdfNmspId(), rdfPropertyVo.getRdfNmspId()) || !StringUtils.equals(prevRdfPropertyDto.getRdfPrptyNm(), rdfPropertyVo.getRdfPrptyNm()))) {
        		this.deleteFromVirtuoso(prevRdfPropertyDto, loginUserVo.getUserId());
        	}

			// 2. 수정
			rdfPropertyMapper.updateRdfProperty(rdfPropertyVo);

			// 3. 수정 후 디지털트윈 네임스페이스 경우 버투소 저장
			this.saveToVirtuoso(rdfPropertyVo.getRdfPrptyId(), loginUserVo.getUserId());

		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[RDF 프라퍼티 수정] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[RDF 프라퍼티 수정] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 프라퍼티 수정] 서비스 종료");
		return rdfPropertyVo.getRdfPrptyId();
	}

	/**
	 * RDF 프라퍼티 삭제
	 *
	 * @param rdfPrptyId
	 * @return
	 * @Author : Ran
	 * @Date : 2023. 07. 05.
	 */
	public void deleteRdfProperty(String rdfPrptyId) {
		log.debug("[RDF 프라퍼티 삭제] 서비스 시작");
		try {
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			RdfPropertyDto rdfPropertyDto = getRdfPropertyDetail(rdfPrptyId);
			if (rdfPropertyDto == null) throw new ResNotFoundException("RDF 프라퍼티가 존재하지 않습니다.");

			validate(rdfPropertyDto, true);

			// 1. 디지털트윈 네임스페이스 경우 버투소에서 삭제
			this.deleteFromVirtuoso(rdfPropertyDto, loginUserVo.getUserId());

			// 2. 삭제
			rdfPropertyMapper.deleteRdfPropertyDefineByProperty(rdfPrptyId);
			rdfPropertyMapper.deleteRdfProperty(rdfPrptyId);

		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[RDF 프라퍼티 삭제] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[RDF 프라퍼티 삭제] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 프라퍼티 삭제] 서비스 종료");
	}

	/*************************************************** RDF 프라퍼티 정의 **********************************************************/

	/**
	 * RDF 프라퍼티 정의 유효성 검사
	 *
	 * @param rdfPropertyDefineVo
	 * @return
	 * @Author : Ran
	 * @Date : 2023. 07. 25.
	 */
	void validate(RdfPropertyDefineVo rdfPropertyDefineVo) {
		// 삭제 시, delete 안에서 검사

		/***************************************** 유효성 검사 - 등록 or 수정 *****************************************/
		boolean errorYn = rdfPropertyMapper.validationDefineDuringEditMode(rdfPropertyDefineVo);
		if (errorYn) {
			RdfPropertyVo rdfProperty = getRdfPropertyDetail(rdfPropertyDefineVo.getRdfPrptyId());
			if (rdfProperty == null) throw new ResNotFoundException("RDF 프라퍼티가 존재하지 않습니다.");

			throw new ResBizInfoException("RDF 프라퍼티("+ rdfProperty.getRdfPrpty() + ", " + rdfPropertyDefineVo.getRdfPrptyId()+ "),\n" +
					"RDF 클래스 ID(" + rdfPropertyDefineVo.getRdfClassId() +
					"),\n도메인 범위 구분 메타코드("+ rdfPropertyDefineVo.getDomnRangeDivMtcd() + ")가 동일한 RDF 프라퍼티 정의가 이미 존재합니다.");
		}
	}

	/**
	 * RDF 프라퍼티 정의 목록 등록 - RDF 클래스 상세 화면 선택 등록
	 *
	 * @param list
	 * @return
	 * @Author : Ran
	 * @Date : 2023. 07. 19.
	 */
	public List<String> createRdfPropertyDefine(List<RdfPropertyDefineVo> list) {
		log.debug("[RDF 프라퍼티 정의 등록] 서비스 시작");
		List<String> resultList = new ArrayList<>();
		try {
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			for (RdfPropertyDefineVo rdfPropertyDefineVo : list) {
				validate(rdfPropertyDefineVo);
			}
			
			// 1. 일괄 정의(관계) 등록
			rdfPropertyMapper.insertRdfPropertyDefineBatch(list);
			
			// 2. 각각 디지털트윈 네임스페이스 경우 버투소 저장
			for (RdfPropertyDefineVo rdfPropertyDefineVo : list) {
				this.saveToVirtuoso(rdfPropertyDefineVo.getRdfPrptyId(),loginUserVo.getUserId());
			}
			
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[RDF 프라퍼티 정의 등록] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[RDF 프라퍼티 정의 등록] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 프라퍼티 정의 등록] 서비스 종료");
		return resultList;
	}

	/**
	 * RDF 프라퍼티 정의 목록 삭제 - RDF 클래스 상세 화면 선택 삭제
	 *
	 * @param list
	 * @return
	 * @Author : Ran
	 * @Date : 2023. 07. 20.
	 */
	@SuppressWarnings("static-access")
	public void deleteRdfPropertyDefine(List<String> list) {
		log.debug("[RDF 프라퍼티 정의 삭제] 서비스 시작");
		try {
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			List<RdfPropertyDefineVo> deleteList = new ArrayList<>();

			for(String rdfPrptyDefId : list){
				RdfPropertyDefineSearchVo rdfPropertyDefineSearchVo = new RdfPropertyDefineSearchVo().builder()
						.rdfPrptyDefId(rdfPrptyDefId)
						.build();
				RdfPropertyDefineVo rdfPropertyDefineVo = rdfPropertyMapper.selectRdfPropertyDefine(rdfPropertyDefineSearchVo);
				rdfMappingService.checkMappingForPrptyDefineDel(rdfPropertyDefineVo.getRdfPrptyId(), rdfPropertyDefineVo.getDomnRangeDivMtcd(), rdfPropertyDefineVo.getRdfClassId());
				deleteList.add(rdfPropertyDefineVo);
			}

			// 1. 일괄 정의(관계) 삭제
			rdfPropertyMapper.deleteRdfPropertyDefineBatch(deleteList);
			
			// 2. 수정 후 각각 디지털트윈 네임스페이스 경우 버투소 저장
			for (RdfPropertyDefineVo rdfPropertyDefineVo : deleteList) {
				this.saveToVirtuoso(rdfPropertyDefineVo.getRdfPrptyId(),loginUserVo.getUserId());
			}

		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[RDF 프라퍼티 정의 삭제] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[RDF 프라퍼티 정의 삭제] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 프라퍼티 정의 삭제] 서비스 종료");
	}

	/**
	 * RDF 프라퍼티 정의 목록 조회
	 *
	 * @param rdfPropertyDefineSearchVo
	 * @return
	 * @Author : Ran
	 * @Date : 2023. 07. 25.
	 */
	public SearchResultListVo getRdfPropertyDefineList(RdfPropertyDefineSearchVo rdfPropertyDefineSearchVo) {

		log.debug("[RDF 프라퍼티 정의 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		try {
			int totalListSize;
			List<RdfPropertyDefineDto> list;
			totalListSize = rdfPropertyMapper.selectRdfPropertyDefineCount(rdfPropertyDefineSearchVo);
			rdfPropertyDefineSearchVo.setTotalListSize(totalListSize);
			list = rdfPropertyMapper.selectRdfPropertyDefineList(rdfPropertyDefineSearchVo);
			listVo.setList(list);
			listVo.setPage(new PageVo(rdfPropertyDefineSearchVo));
		} catch (Exception e) {
			log.error("[RDF 프라퍼티 정의 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 프라퍼티 정의 목록 조회] 서비스 종료");
		return listVo;
	}

	/**
	 * RDF 프라퍼티 정보를 버투소 그래프 DB에서 삭제 (시스템 정의 RDF 스키마일 경우만)
	 * @Author      : heenim
	 * @Date        : 2023. 11. 10.
	 * @param rdfClassId
	 * @param logRegrId
	 * @return
	 */
	private boolean deleteFromVirtuoso(RdfPropertyDto rdfPrptyDto, String logRegrId) {
		boolean bDeleted = false;
		try {
			if (rdfPrptyDto != null && StringUtils.startsWith(rdfPrptyDto.getRdfPrptyIri(), dtmetaProperty.getRdfSchemaBaseUrl())) {
				virtuosoService.deleteRdfNsToGraphByUriForUse(rdfPrptyDto.getRdfPrptyIri(), logRegrId);
				bDeleted = true;
			}
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.error("[RDF 프라퍼티 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) : {} - {}", rdfPrptyDto.getRdfPrptyIri(), e.getReason());
		} catch (Exception e) {
			log.error("[RDF 프라퍼티 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) - {}", rdfPrptyDto.getRdfPrptyIri(), e);
		}
		return bDeleted;
	}

	/**
	 * RDF 프라퍼티 정보를 버투소 그래프 DB에 반영 (시스템 정의 RDF 스키마일 경우만)
	 * @Author      : heenim
	 * @Date        : 2023. 11. 10.
	 * @param rdfClassId
	 * @param logRegrId
	 */
	private void saveToVirtuoso(String rdfPrptyId, String logRegrId) {
		String logIri = rdfPrptyId;
		try {
			RdfPropertyDto rdfPrptyDto = this.getRdfPropertyDetail(rdfPrptyId);
			if (rdfPrptyDto != null && StringUtils.startsWith(rdfPrptyDto.getRdfPrptyIri(), dtmetaProperty.getRdfSchemaBaseUrl())) {
				logIri = rdfPrptyDto.getRdfPrptyIri();
				virtuosoService.saveRdfNsToGraphByUriForUse(rdfPrptyDto.getRdfPrptyIri(), logRegrId);
			}
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.error("[RDF 프라퍼티 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) : {} - {}", logIri, e.getReason());
		} catch (Exception e) {
			log.error("[RDF 프라퍼티 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) - {}", logIri, e);
		}
	}

}