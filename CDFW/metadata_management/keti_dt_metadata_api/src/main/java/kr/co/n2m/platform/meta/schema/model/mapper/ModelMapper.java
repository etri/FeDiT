package kr.co.n2m.platform.meta.schema.model.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.schema.model.domain.DataTypeModelDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelListDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelSearchVo;
import kr.co.n2m.platform.meta.schema.model.domain.ModelTreeDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
import kr.co.n2m.platform.meta.schema.model.domain.ObjectTypeModelDto;

@Mapper
public interface ModelMapper {
	
	int selectModelCount(ModelSearchVo searchVo);
	List<ModelListDto> selectModelList(ModelSearchVo searchVo);
	List<ModelTreeDto> selectModelTreeList(ModelSearchVo searchVo);
	ModelVo selectModel(ModelVo vo);
	ModelVo selectModelByName(ModelVo modelVo);
	ModelVo selectTypeModelByDataUri(ModelVo modelVo);
	int selectModelNameCheck(String modelNm);
	int selectModelUriCheck(ModelVo modelVo);

	int selectDataTypeModelCount(ModelSearchVo searchVo);
	List<DataTypeModelDto> selectDataTypeModelList(ModelSearchVo searchVo);
	void insertDataTypeModel(ModelVo vo);
	void updateDataTypeModel(ModelVo vo);
	
	int selectDataTypeModelDeleteCheck(String modelId);
	void deleteModel(String modelId);
	void updateModelSttus(ModelVo vo);
	
	int selectTypeModelCount(ModelSearchVo searchVo);
	List<ObjectTypeModelDto> selectTypeModelList(ModelSearchVo searchVo);
	void insertTypeModel(ModelVo vo);
	void updateTypeModel(ModelVo vo);
	int selectTypeModelDeleteCheck(String modelId);
	
	int selectStdModelCount(ModelSearchVo searchVo);
	List<ObjectTypeModelDto> selectStdModelList(ModelSearchVo searchVo);
	void insertStdModel(ModelVo vo);
	void updateStdModel(ModelVo vo);
	int selectStdModelDeleteCheck(String modelId);
	
	CamelCaseMap selectSubModelCountMapByModelId(ModelSearchVo searchVo);
}
