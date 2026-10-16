package kr.co.n2m.platform.meta.schema.modelproperty.service;

import java.util.HashMap;
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
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
import kr.co.n2m.platform.meta.schema.model.service.ModelService;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertySearchVo;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyVo;
import kr.co.n2m.platform.meta.schema.modelproperty.mapper.ModelPropertyMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class ModelPropertylService {

	@Autowired
	private ModelPropertyMapper modelPropertyMapper;
	
	@Autowired
	private ModelService modelService;
	
	public SearchResultListVo getModelPropertyList(ModelPropertySearchVo searchVo) {
		log.debug("[메타데이터 모델 프라퍼티목록 검색] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		try {
			int totalListSize = modelPropertyMapper.selectModelPropertyCount(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<ModelPropertyVo> list = modelPropertyMapper.selectModelPropertyList(searchVo);			
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
		} catch (Exception e) {
			log.debug("[메타데이터 모델 프라퍼티목록 검색] 실패/오류");
			throw new ResBaseRuntimeException(e); 
		}
		log.debug("[메타데이터 모델 프라퍼티목록 검색] 서비스 종료");
		return listVo;
	}
	
	public SearchResultListVo getTypeModelPropertyList(ModelPropertySearchVo searchVo) {
		log.debug("[메타데이터 유형 모델 프라퍼티목록 검색] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		try {
			List<ModelPropertyVo> list = modelPropertyMapper.selectTypeModelPropertyList(searchVo);
			PageVo pageVo = new PageVo();
			pageVo.setIsPaging(false); // TODO: LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
			listVo.setList(list);
			listVo.setPage(pageVo);
		} catch (Exception e) {
			log.debug("[메타데이터 유형 모델 프라퍼티목록 검색] 실패/오류");
			throw new ResBaseRuntimeException(e); 
		}
		log.debug("[메타데이터 유형 모델 프라퍼티목록 검색] 서비스 종료");
		return listVo;
	}
	
	public HashMap<String, Object> createModelProperty(String modelId, List<ModelPropertyVo> list, String gbn) {
		log.debug("[메타데이터 모델 프라퍼티 등록] 서비스 시작");
		
		int successCount = 0;
		
		for(ModelPropertyVo modelPropertyVo : list) {
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			
			modelPropertyVo.setModelPrptyRegrId(loginUserVo.getUserId());
			modelPropertyVo.setModelPrptyRegrNm(loginUserVo.getUserNm());
			modelPropertyVo.setModelPrptyAmdrId(loginUserVo.getUserId());
			modelPropertyVo.setModelPrptyAmdrNm(loginUserVo.getUserNm());
			
			int checkCnt = 0;
			try {
				checkCnt = modelPropertyMapper.selectModelPropertyCheck(modelPropertyVo);
				if(checkCnt == 0) {
					if(StringUtils.isBlank(modelPropertyVo.getModelPrptyMandMtcd())) modelPropertyVo.setModelPrptyMandMtcd("optional");
					modelPropertyMapper.insertModelProperty(modelPropertyVo);
					successCount++;
				}
			} catch (Exception e) {
				log.debug("[메타데이터 유형 프라퍼티 등록] 실패/오류");
				throw new ResBaseRuntimeException(e);
			}
		}
		
		// 성공		
		modelService.clearAllModelCache();  // clear 캐시
		
		HashMap<String, Object> resultMap= new HashMap<>();
		resultMap.put("successCount", successCount);
		resultMap.put("failCount", list.size() - successCount);
		resultMap.put("id", modelId);
		
		log.debug("[메타데이터 모델 프라퍼티 등록] 서비스 종료");
		return resultMap;
	}
	
	public void modifyModelProperty(List<ModelPropertyVo> list) {
		log.debug("[메타데이터 모델 프라퍼티 수정] 서비스 시작");
		
		for(ModelPropertyVo modelPropertyVo : list) {
			try {
				LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
				modelPropertyVo.setModelPrptyAmdrId(loginUserVo.getUserId());
				modelPropertyVo.setModelPrptyAmdrNm(loginUserVo.getUserNm());
				
				modelPropertyMapper.updateModelProperty(modelPropertyVo);
			} catch (ResBadRequestException | ResBizInfoException e) {
				log.info("[메타데이터 모델 프라퍼티 수정] 실패/오류 (정보성) : {}", e.getMessage());
				throw e;
			} catch (Exception e) {
				log.info("[메타데이터 모델 프라퍼티 수정] 실패/오류", e);
				throw new ResBaseRuntimeException(e);
			}
		}
		
		// 성공	
		modelService.clearAllModelCache();  // clear 캐시
		
		log.debug("[메타데이터 모델 프라퍼티 수정] 서비스 종료");
	}
	
	public HashMap<String, Object> deleteModelProperty(String modelId, List<ModelPropertyVo> list) {
		log.debug("[메타데이터 모델 프라퍼티 삭제] 서비스 시작");
		int updateCount = 0;
		String[] updateId = new String[list.size()];
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		
		try {
			
			if (list == null || list.size() == 0) throw new ResBadRequestException("삭제할 데이터가 없습니다.");
			
			ModelVo modelVo = modelService.getModel(modelId);
			if (modelVo == null) throw new ResBadRequestException("해당 모델이 존재하지 않습니다.");
		
			for(ModelPropertyVo modelPropertyVo : list) {
				
				modelPropertyVo.setModelPrptyAmdrId(loginUserVo.getUserId());
				modelPropertyVo.setModelPrptyAmdrNm(loginUserVo.getUserNm());
				modelPropertyVo.setModelPrptyDelrId(loginUserVo.getUserId());
				modelPropertyVo.setModelPrptyDelrNm(loginUserVo.getUserNm());

				// 유형 모델인 경우, 표준 모델에서 이미 사용중인지 체크. 진짜로 삭제하고 싶다면 표준 모델에서 먼저 삭제 해야 함.
				if ("Y".equals(modelVo.getTypeModelYn())) {
					ModelPropertySearchVo chkParamVo = new ModelPropertySearchVo();
					chkParamVo.setTypeModelId(modelVo.getTypeModelId());
					chkParamVo.setPrptyId(modelPropertyVo.getPrptyId());
					int cnt = modelPropertyMapper.selectStdModelPropertyCountForDelCheck(chkParamVo);
					if (cnt > 0) throw new ResBizInfoException("[" + modelVo.getModelNm() + "] 유형의 표준 모델(" + cnt + "건)에서 해당 프라퍼티를 사용하고 있어 삭제할 수 없습니다.");
				}
					
				// 메타데이터에서 사용중인지 체크
				int checkCnt = modelPropertyMapper.selectMetaDataUseCheck(modelPropertyVo.getModelPrptyId());				
				if (checkCnt == 0 ) {
					// 삭제
					modelPropertyMapper.deleteModelProperty(modelPropertyVo.getModelPrptyId());					
				} else {
					// model_prpty_del_yn을 Y로
					modelPropertyMapper.updateModelPropertyDelYn(modelPropertyVo);
					updateId[updateCount] = modelPropertyVo.getModelPrptyId() + " / " + modelPropertyVo.getPrptyId();
					updateCount ++;
				}
	
			}
		
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[메타데이터 모델 프라퍼티 삭제] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.info("[메타데이터 모델 프라퍼티 삭제] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}	
		
		// 성공
		modelService.clearAllModelCache();  // clear 캐시
		
		HashMap<String, Object> resultMap= new HashMap<>();
		resultMap.put("updateCount", updateCount);
		resultMap.put("deleteCount", list.size() - updateCount);
		resultMap.put("updateId", updateId);

		log.debug("[메타데이터 모델 프라퍼티 삭제] 서비스 종료");
		return resultMap;
	}
}