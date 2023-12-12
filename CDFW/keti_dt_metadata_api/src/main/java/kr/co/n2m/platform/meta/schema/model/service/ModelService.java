package kr.co.n2m.platform.meta.schema.model.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.RangeDataTypeMtcd;
import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.portal.code.domain.CodeVo;
import kr.co.n2m.platform.meta.portal.code.service.CodeGroupService;
import kr.co.n2m.platform.meta.schema.model.domain.ModelApiDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelListDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelSearchVo;
import kr.co.n2m.platform.meta.schema.model.domain.ModelTreeDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
import kr.co.n2m.platform.meta.schema.model.mapper.ModelMapper;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyApiDto;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyInfoDto;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ModelService {
	
	@Autowired
	private ModelCacheService modelCacheService;	
	
	@Autowired
	private ModelMapper modelMapper;
	
	@Autowired
	private CodeGroupService codeGroupService;		
	
	public SearchResultListVo getModelList(ModelSearchVo searchVo) {
		log.debug("[모델 검색] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		try {
			
			int totalListSize = modelMapper.selectModelCount(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<ModelListDto> list = modelMapper.selectModelList(searchVo);			
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
		} catch (Exception e) {
			log.error("[모델 검색] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[모델 검색] 서비스 종료");
		return listVo;
	}
	
	/**
	 * 모델 트리 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 25.
	 * @param searchVo
	 * @return
	 */
	public ModelTreeDto getModelTree(ModelSearchVo searchVo) { // TODO 추후 캐시 서비스로 넘기는 작업이 필요할 수 있음
		log.debug("[모델 트리 조회] 서비스 시작");
		ModelTreeDto rootDto = null;
		try {
			List<ModelTreeDto> treeList = modelMapper.selectModelTreeList(searchVo);
			// 이미 트리로 조회했으므로 이 로직으로 함.			
			if (treeList != null && !treeList.isEmpty()) {
				// root		
				rootDto = treeList.get(0);	
				rootDto.setIndex(0);
				
				ModelTreeDto currDto = rootDto;
				int currDepth = 0;
				
				for (int i = 1; i < treeList.size(); i++) { // 1 부터 시작
					ModelTreeDto tDto = treeList.get(i);				
					tDto.setIndex(i);
					
					if (StringUtils.equals(currDto.getModelId(), tDto.getUpModelId())) {
						if (currDto.getChildren() == null) {
							currDto.setChildren(new ArrayList<ModelTreeDto>());
						}
						currDto.getChildren().add(tDto);
						
						tDto.setUpIndex(currDto.getIndex());
						currDto = tDto;
						currDepth++;
						
					} else {
						for (int j = currDepth; j > 0; j--) {
							currDto = treeList.get(currDto.getUpIndex());
							currDepth--;
							
							if (StringUtils.equals(currDto.getModelId(), tDto.getUpModelId())) {
								if (currDto.getChildren() == null) {
									currDto.setChildren(new ArrayList<ModelTreeDto>());
								}
								currDto.getChildren().add(tDto);
								
								tDto.setUpIndex(currDto.getIndex());
								currDto = tDto;
								currDepth++;
								break;
							}
						}
					}
				}
			}
		} catch (Exception e) {
			log.error("[모델 트리 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[모델 트리 조회] 서비스 종료");
		return rootDto;
	}

	public ModelVo getModel(String modelId) {
		log.debug("[모델 상세 조회] 서비스 시작");
		ModelVo vo = new ModelVo();
		try {
			vo.setModelId(modelId);
			vo = modelMapper.selectModel(vo);
		} catch (Exception e) {
			log.error("[모델 상세 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[모델 상세 조회] 서비스 종료");
		return vo;
	}
	
	public Map<String, Boolean> getModelNameCheck(String modelNm) {
		log.debug("[모델명 중복체크] 서비스 시작");
		Map<String, Boolean> resMap = new HashMap<>();
		try {
			int cnt = modelMapper.selectModelNameCheck(modelNm);
			boolean check = cnt > 0 ? true : false;  
			resMap.put("duplicated", check);			  
		} catch (Exception e) {
			log.error("[모델명 중복체크] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[모델명 중복체크] 서비스 종료");
		return resMap;
	}
	
	public Map<String, Boolean> getModelUriCheck(String modelDataUri, String modelId) {
		log.debug("[데이터URI 중복체크] 서비스 시작");
		Map<String, Boolean> resMap = new HashMap<>();
		try {
			ModelVo modelVo = new ModelVo();
			modelVo.setModelDataUri(modelDataUri);
			modelVo.setModelId(modelId);
			int cnt = modelMapper.selectModelUriCheck(modelVo);
			boolean check = cnt > 0 ? true : false;  
			resMap.put("duplicated", check);	
		} catch (Exception e) {
			log.error("[데이터URI 중복체크] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[데이터URI 중복체크] 서비스 종료");
		return resMap;
	}
	
	/**
	 * 모든 모델 Cache 재조회를 위한 clear
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 */
	public void clearAllModelCache() {
		log.debug("[모든 모델 Cache 재조회를 위한 clear] 서비스 시작");
		modelCacheService.removeModelListAll();
		modelCacheService.removeModelInfoAll();
		modelCacheService.removeTypeModelAllByDataUri();
		log.debug("[모든 모델 Cache 재조회를 위한 clear] 서비스 종료");
	}
	
	/**
	 * 캐시에서 모델 ID 로 모델 명 가져오기.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param modelId
	 * @return
	 */
	public String getModelNameFromCache(String modelId) {
		List<ModelListDto> list = modelCacheService.getModelList();
		if (list != null && !list.isEmpty()) {
			for (ModelListDto tDto : list) {
				if (StringUtils.equals(modelId, tDto.getModelId())) {
					return tDto.getModelNm();
				}
			}
		}
		return null;
	}
	
	/**
	 * 캐시에서 모델 ID 로 모델 정보 DTO 가져오기.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param modelId
	 * @return 
	 */
	public ModelInfoDto getModelInfoByIdFromCache(String modelId) {
		ModelInfoDto modelInfoDto = null;
		String modelNm = this.getModelNameFromCache(modelId);
		if (modelNm != null) {
			modelInfoDto = modelCacheService.getModelInfoByName(modelNm);
		}
		return modelInfoDto;
	}
	
	/**
	 * 캐시에서 모델명 으로 모델 정보 DTO 가져오기.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param modelNm
	 * @return
	 */
	public ModelInfoDto getModelInfoByNameFromCache(String modelNm) {
		ModelInfoDto modelInfoDto = null;
		if (modelNm != null) {
			modelInfoDto = modelCacheService.getModelInfoByName(modelNm);
		}
		return modelInfoDto;		
	}	
	
	/**
	 * 모델 삭제 전에 사용 상태인 하위 모델이 있는지 체크
	 * @Author      : heenim
	 * @Date        : 2023. 06. 19.
	 * @param modelId
	 * @throws ResBizInfoException
	 * @return 폐기 상태 하위 모델 건수
	 */
	public int checkExistSubModelForDeleteAndGetDisuseCnt(String modelId) throws ResBizInfoException {
		// 하위 모델이 있는 경우 삭제 및 폐기 처리 불가. 하위 모델을 전부 삭제/폐기 처리 후 가능.
		ModelSearchVo paramVo = new ModelSearchVo();
		paramVo.setModelId(modelId);
		CamelCaseMap cntMap = modelMapper.selectSubModelCountMapByModelId(paramVo);
		int useCnt = Integer.valueOf( String.valueOf(cntMap.get("useSubCnt")) );
		int disuseCnt = Integer.valueOf( String.valueOf(cntMap.get("disuseSubCnt")) );
		if (useCnt > 0) throw new ResBizInfoException("현재 모델의 하위에 사용중인 모델이 있어서 삭제할 수 없습니다. (" + useCnt + "건)");		
		return disuseCnt;
	}
	
	/**
	 * 외부 API 용 모델 정보 반환.
	 * @Author      : heenim
	 * @Date        : 2023. 06. 27.
	 * @param modelNm
	 * @return
	 */
	public ModelApiDto getApiModelInfoByModelNm(String modelNm) {
		ModelApiDto apiDto = new ModelApiDto();
		apiDto.setMetaModel(modelNm);
		
		ModelInfoDto modelInfoDto = this.getModelInfoByNameFromCache(modelNm);
		if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
		
		// 모델 정보 복사
		BeanUtils.copyProperties(modelInfoDto, apiDto);
		
		// 모델 프라퍼티 정보 복사
		List<String> properties = new ArrayList<>();
		List<ModelPropertyApiDto> propertyInfos = new ArrayList<>();
		ModelPropertyApiDto pApiDto = null;
		for (ModelPropertyInfoDto dto : modelInfoDto.getPropertyMap().valueList()) {
			properties.add(dto.getPrptyNm());
			pApiDto = new ModelPropertyApiDto(dto);
			propertyInfos.add(pApiDto);
			if (RangeDataTypeMtcd.code_.code().equals(dto.getRangeDataTypeMtcd()) && StringUtils.isNotBlank(dto.getRangeMtcdGrpId())) {
				List<CodeVo> codeList = codeGroupService.getValidCodeListFromCache(dto.getRangeMtcdGrpId());
				if (codeList != null && codeList.size() > 0) {
					List<Map<String, String>> rangeCodes = codeList.stream()
						.map(x -> {
							Map<String, String> newMap = new HashMap<>();
							newMap.put("code"  , x.getMtcd());
							newMap.put("codeNm", x.getMtcdNm());
							return newMap;
						}).collect(Collectors.toList());
					pApiDto.setRangeCodes(rangeCodes);
				}
			}
		}
		apiDto.setProperties(properties);
		apiDto.setPropertyInfos(propertyInfos);

		return apiDto;
	}
	
}
