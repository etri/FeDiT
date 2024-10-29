package kr.co.n2m.platform.meta.schema.modelproperty.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.schema.model.domain.ModelSearchVo;
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyInfoDto;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertySearchVo;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyVo;

@Mapper
public interface ModelPropertyMapper {
	
	int selectModelPropertyCount(ModelPropertySearchVo searchVo);
	List<ModelPropertyVo> selectModelPropertyList(ModelPropertySearchVo searchVo);
	List<ModelPropertyVo> selectTypeModelPropertyList(ModelPropertySearchVo searchVo);
	
	int selectModelPropertyCheck(ModelPropertyVo vo);
	void insertModelProperty(ModelPropertyVo vo);
	void updateModelProperty(ModelPropertyVo vo);

	int selectStdModelPropertyCountForDelCheck(ModelPropertySearchVo searchVo);
	int selectMetaDataUseCheck(String modelPrptyId);
	void updateModelPropertyDelYn(ModelPropertyVo vo);
	void deleteModelProperty(String modelPrptyId);
	List<ModelPropertyInfoDto> selectModelPropertyInfoListByModelId(ModelVo modelVo);
	List<ModelPropertyInfoDto> selectModelPropertyInfoListByModelIdForNeo4j(ModelSearchVo modelSearchVo);
	
	int selectMetaDataCheckByProperty(String prptyId);
}
