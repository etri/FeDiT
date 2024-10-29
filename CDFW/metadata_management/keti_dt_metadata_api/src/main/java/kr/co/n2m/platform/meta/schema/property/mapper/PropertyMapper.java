package kr.co.n2m.platform.meta.schema.property.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertySearchVo;
import kr.co.n2m.platform.meta.schema.property.domain.PropertyDataTypeDto;
import kr.co.n2m.platform.meta.schema.property.domain.PropertySearchVo;
import kr.co.n2m.platform.meta.schema.property.domain.PropertyVo;

@Mapper
public interface PropertyMapper {
	
	int selectPropertyCount(PropertySearchVo searchVo);
	List<CamelCaseMap> selectTypePropertyList(ModelPropertySearchVo searchVo);
	List<CamelCaseMap> selectPropertyList(PropertySearchVo searchVo);
	PropertyVo selectProperty(PropertyVo vo);
	PropertyVo selectPropertyDefine(PropertyVo vo);
	void insertProperty(PropertyVo vo);
	void insertPropertyDefine(PropertyVo vo);
	void updateProperty(PropertyVo vo);	
	void updatePropertyDefine(PropertyVo vo);	
	int selectPropertyNameCheck(String prptyNm);
	int selectPropertyIdCheck(String prptyId);
	
	List<PropertyVo> selectPropertyDefineChgList(PropertyVo vo);
	
	List<PropertyDataTypeDto> selectPropertyDataTypeList(PropertySearchVo searchVo);	
}
