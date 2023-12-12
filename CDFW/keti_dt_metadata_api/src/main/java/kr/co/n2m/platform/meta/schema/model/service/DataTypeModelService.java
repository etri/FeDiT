package kr.co.n2m.platform.meta.schema.model.service;

import java.util.List;

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
import kr.co.n2m.platform.meta.schema.model.domain.DataTypeModelDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelSearchVo;
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
import kr.co.n2m.platform.meta.schema.model.mapper.ModelMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class DataTypeModelService extends ModelService {

	@Autowired
	private ModelMapper modelMapper;
	
	public SearchResultListVo getDataTypeModelList(ModelSearchVo searchVo) {
		SearchResultListVo listVo = new SearchResultListVo();
		try {
			int totalListSize = modelMapper.selectDataTypeModelCount(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<DataTypeModelDto> list = modelMapper.selectDataTypeModelList(searchVo);			
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
		} catch (Exception e) {
			e.printStackTrace();
			throw new ResBaseRuntimeException(e); 
		}
		
		return listVo;
	}
	
	public ModelVo getDataTypeModel(String modelId ) {
		log.debug("[DataType 모델 상세 조회] 서비스 시작");
		ModelVo vo = new ModelVo();
		try {
			vo.setModelId(modelId);
			vo = modelMapper.selectModel(vo);
		} catch (Exception e) {
			log.error("[DataType 모델 상세 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[DataType 모델 상세 조회] 서비스 종료");
		return vo;
	}	
	
	public String createDataTypeModel(ModelVo modelVo) {
		log.debug("[DataType 모델 등록] 서비스 시작");
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		
		modelVo.setModelRegrId(loginUserVo.getUserId());
		modelVo.setModelRegrNm(loginUserVo.getUserNm());
		modelVo.setModelAmdrId(loginUserVo.getUserId());
		modelVo.setModelAmdrNm(loginUserVo.getUserNm());
		
		try {
			StringBuffer sb = new StringBuffer();
			
			//필수 check
			if((Integer)modelVo.getModelSortOdrg() != null) {
				if (modelVo.getModelSortOdrg() < 0 || modelVo.getModelSortOdrg() > 99999) { sb.append("modelSortOdrg").append(ValueUtil.mustBeBetween("0","99999")).append("\n"); }
			}
			
			if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
			
			int checkCnt = modelMapper.selectModelNameCheck(modelVo.getModelNm());
			if(checkCnt > 0) throw new ResBizInfoException("[" + modelVo.getModelNm() + "]" + "는(은) 이미 등록되어 있습니다.");
			
			modelMapper.insertDataTypeModel(modelVo);
			
			this.clearAllModelCache(); // clear 캐시
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[DataType 모델 등록] 등록 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[DataType 모델 등록] 등록 실패/오류 ", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[DataType 모델 등록] 서비스 종료");
		return modelVo.getModelId();
	}
	
	public void modifyDataTypeModel(ModelVo modelVo) {
		log.debug("[DataType 모델 수정] 서비스 시작");
		try {
			StringBuffer sb = new StringBuffer();
			
			//필수 check
			if((Integer)modelVo.getModelSortOdrg() != null) {
				if (modelVo.getModelSortOdrg() < 0 || modelVo.getModelSortOdrg() > 99999) { sb.append("modelSortOdrg").append(ValueUtil.mustBeBetween("0","99999")).append("\n"); }
			}
			
			if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			modelVo.setModelAmdrId(loginUserVo.getUserId());
			modelVo.setModelAmdrNm(loginUserVo.getUserNm());
			
			modelMapper.updateDataTypeModel(modelVo);
			
			this.clearAllModelCache(); // clear 캐시
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[DataType 모델 수정]  수정 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[DataType 모델 수정]  수정 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[DataType 모델 수정] 서비스 종료");
	}
	
	public void deleteDataTypeModel(String modelId) {
		log.debug("[DataType 모델 삭제] 서비스 시작");
		try {
			// 사용한 곳이 있으면 삭제 불가. (현재 모델이 도메인모델, 범위모델 이 되었거나 모델 프라퍼티에 있을 경우)
			int cnt = modelMapper.selectDataTypeModelDeleteCheck(modelId);
			if (cnt > 0) throw new ResBizInfoException("모델이 다른 곳에서 사용중이어서 삭제 할 수 없습니다.");
			
			// 사용한 곳이 없으면 삭제
			modelMapper.deleteModel(modelId);				
			
			this.clearAllModelCache(); // clear 캐시
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[DataType 모델 삭제]  실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[DataType 모델 삭제]  실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[DataType 모델 삭제] 서비스 종료");
	}
}
