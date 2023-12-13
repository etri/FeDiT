package com.federated.searchRule.restfulApi.service;

import java.util.HashMap;

import com.federated.searchRule.restfulApi.vo.Category;

public interface CategoryService {

	public Category searchCategory(HashMap<String, Object> map) throws Exception;

	public int createCategory(Category category) throws Exception;

	public int updateCategory(Category category) throws Exception;

	public int deleteCategory(HashMap<String, Object> map) throws Exception;

}
