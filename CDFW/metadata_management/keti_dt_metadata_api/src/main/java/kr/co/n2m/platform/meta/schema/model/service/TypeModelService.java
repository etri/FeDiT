package kr.co.n2m.platform.meta.schema.model.service;

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
import kr.co.n2m.platform.meta.schema.model.domain.ModelSearchVo;
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
import kr.co.n2m.platform.meta.schema.model.domain.ObjectTypeModelDto;
import kr.co.n2m.platform.meta.schema.model.mapper.ModelMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class TypeModelService extends ModelService {
	
	@Autowired
	private ModelMapper modelMapper;
	
	public SearchResultListVo getModelListByType(ModelSearchVo searchVo) {
		SearchResultListVo listVo = new SearchResultListVo();
		try {
			int totalListSize = modelMapper.selectTypeModelCount(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<ObjectTypeModelDto> list = modelMapper.selectTypeModelList(searchVo);			
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
		} catch (Exception e) {
			log.error("[유형 모델 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e); 
		}
		return listVo;
	}

	public ModelVo getModelByType(String modelId) {
		log.debug("[유형 모델 상세 조회] 서비스 시작");
		ModelVo vo = new ModelVo();
		try {
			vo.setModelId(modelId);
			vo = modelMapper.selectModel(vo);
		} catch (Exception e) {
			log.error("[유형 모델 상세 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[Data유형 모델 상세 조회] 서비스 종료");
		return vo;
	}
	
	public String createTypeModel(ModelVo modelVo) {
		log.debug("[유형 모델 등록] 서비스 시작");
    	StringBuffer sb = new StringBuffer();		
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		
		modelVo.setModelRegrId(loginUserVo.getUserId());
		modelVo.setModelRegrNm(loginUserVo.getUserNm());
		modelVo.setModelAmdrId(loginUserVo.getUserId());
		modelVo.setModelAmdrNm(loginUserVo.getUserNm());
		
		try {
	    	// 필수 체크
	    	if (StringUtils.isBlank(modelVo.getModelNm())) { sb.append("modelNm").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(modelVo.getModelDataUri())) { sb.append("modelDataUri").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(modelVo.getStructdModelYn())) { sb.append("structdModelYn").append(ValueUtil.required()).append("\n"); }
	    	else if (StringUtils.equals("Y", modelVo.getStructdModelYn()) && StringUtils.isBlank(modelVo.getStructdModelSchmaMtcd())) {
	    		sb.append("structdModelSchmaMtcd").append(ValueUtil.required()).append("\n");
	    	}
	    	if (StringUtils.isNotBlank(modelVo.getModelDataSttusMtcd()) && !StringUtils.equalsAny(modelVo.getModelDataSttusMtcd(), "use", "disuse")) {
	    		sb.append("modelDataSttusMtcd").append(ValueUtil.invalid()).append("\n"); 
	    	}
	    	if((Integer)modelVo.getModelSortOdrg() != null) {
				if (modelVo.getModelSortOdrg() < 0 || modelVo.getModelSortOdrg() > 99999) { sb.append("modelSortOdrg").append(ValueUtil.mustBeBetween("0","99999")).append("\n"); }
			}
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());	
	    	
			if (!modelVo.getModelDataUri().startsWith("/")) {
				throw new ResBizInfoException("URI 는 '/' 로 시작해야 합니다.");
			}	    	
			if (modelVo.getModelDataUri().substring(1).indexOf("/") != -1) {
				throw new ResBizInfoException("URI 중간에는 '/' 를 넣을 수 없습니다.");
			}
			
			// 기본값 설정
			if(StringUtils.isBlank( modelVo.getModelDataSttusMtcd() )) {
				modelVo.setModelDataSttusMtcd("use");
			}
			modelVo.setModelId(modelVo.getModelNm());			
			modelVo.setUpModelId("Class");
			modelVo.setTypeModelId(modelVo.getModelId());
			modelVo.setModelTypeMtcd("object_type");
			modelVo.setAbstrtModelYn("Y");
			
			int checkCnt = modelMapper.selectModelNameCheck(modelVo.getModelNm());
			if(checkCnt > 0) throw new ResBizInfoException("[" + modelVo.getModelNm() + "] 모델명 은 이미 등록되어 있습니다.");
			
			checkCnt = modelMapper.selectModelUriCheck(modelVo);
			if(checkCnt > 0) throw new ResBizInfoException("[" + modelVo.getModelDataUri() + "] URI 는 이미 등록되어 있습니다.");
			
			modelMapper.insertTypeModel(modelVo);
			
			this.clearAllModelCache(); // clear 캐시
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[유형 모델 등록] 등록 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[유형 모델 등록] 등록 실패/오류 ", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[유형 모델 등록] 서비스 종료");
		return modelVo.getModelId();
	}
	
	public void modifyTypeModel(ModelVo modelVo) {
		log.debug("[유형 모델 수정] 서비스 시작");
    	StringBuffer sb = new StringBuffer();
    	
		try {
	    	// 필수 체크
	    	if (StringUtils.isBlank(modelVo.getModelId())) { sb.append("modelId").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(modelVo.getModelDataUri())) { sb.append("modelDataUri").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(modelVo.getStructdModelYn())) { sb.append("structdModelYn").append(ValueUtil.required()).append("\n"); }
	    	else if (StringUtils.equals("Y", modelVo.getStructdModelYn()) && StringUtils.isBlank(modelVo.getStructdModelSchmaMtcd())) {
	    		sb.append("structdModelSchmaMtcd").append(ValueUtil.required()).append("\n");
	    	}
	    	if (StringUtils.isBlank(modelVo.getModelDataSttusMtcd())) { sb.append("modelDataSttusMtcd").append(ValueUtil.required()).append("\n"); }
	    	else if (!StringUtils.equalsAny(modelVo.getModelDataSttusMtcd(), "use", "disuse")) {
	    		sb.append("modelDataSttusMtcd").append(ValueUtil.invalid()).append("\n"); 
	    	}	    	
	    	if((Integer)modelVo.getModelSortOdrg() != null) {
				if (modelVo.getModelSortOdrg() < 0 || modelVo.getModelSortOdrg() > 99999) { sb.append("modelSortOdrg").append(ValueUtil.mustBeBetween("0","99999")).append("\n"); }
			}
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());	
	    	
			if (!modelVo.getModelDataUri().startsWith("/")) {
				throw new ResBizInfoException("URI 는 '/' 로 시작해야 합니다.");
			}	    	
			if (modelVo.getModelDataUri().substring(1).indexOf("/") != -1) {
				throw new ResBizInfoException("URI 중간에는 '/' 를 넣을 수 없습니다.");
			}
			
			int checkCnt = modelMapper.selectModelUriCheck(modelVo);
			if(checkCnt > 0) throw new ResBizInfoException("[" + modelVo.getModelDataUri() + "] URI 는 이미 등록되어 있습니다.");
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			modelVo.setModelAmdrId(loginUserVo.getUserId());
			modelVo.setModelAmdrNm(loginUserVo.getUserNm());			
			
			modelMapper.updateTypeModel(modelVo);
			
			this.clearAllModelCache(); // clear 캐시
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[유형 모델 수정]  수정 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[유형 모델 수정]  수정 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[유형 수정] 서비스 종료");
	}
	
	public void deleteTypeModel(String modelId) {
		log.debug("[유형 모델 삭제] 서비스 시작");
		try {
			// 사용한 곳이 있으면 삭제 불가. (현재 모델이 상위모델, 유형모델, 도메인모델, 범위모델 이 되었거나 모델 프라퍼티가 있을 경우)
			int cnt = modelMapper.selectTypeModelDeleteCheck(modelId);
			if (cnt > 0) throw new ResBizInfoException("모델이 다른 곳에서 사용중이어서 삭제 할 수 없습니다.");
			
			// 사용한 곳이 없으면 삭제
			modelMapper.deleteModel(modelId);			
			
			this.clearAllModelCache(); // clear 캐시
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[유형 모델 삭제]  실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[유형 모델 삭제]  실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[유형 모델 삭제] 서비스 종료");
	}

}
