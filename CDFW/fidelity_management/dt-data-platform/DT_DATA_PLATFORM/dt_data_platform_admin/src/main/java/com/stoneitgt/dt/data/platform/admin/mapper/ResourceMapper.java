package com.stoneitgt.dt.data.platform.admin.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.stoneitgt.dt.data.platform.domain.Resource;


@Mapper
public interface ResourceMapper {

	int insertResource(Resource resource);
	int updateResource(Resource resource);
}
