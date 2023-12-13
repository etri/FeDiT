package com.federated.searchRule.restfulApi.dao;

import java.util.HashMap;

import org.apache.ibatis.annotations.Mapper;

import com.federated.searchRule.restfulApi.vo.Category;

@Mapper
public interface CategoryMapper {

	Category searchCategory(HashMap<String, Object> map);

	int updateCategory(Category category);

	int createCategory(Category category);

	int deleteCategory(HashMap<String, Object> map);

}
	