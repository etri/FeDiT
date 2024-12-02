package com.federated.searchRule.restfulApi.service.impl;

import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.federated.searchRule.restfulApi.dao.CategoryMapper;
import com.federated.searchRule.restfulApi.service.CategoryService;
import com.federated.searchRule.restfulApi.vo.Category;

@Service
public class CategoryServiceImpl implements CategoryService {

	@Autowired
	public CategoryMapper categoryMapper;

	@Transactional(readOnly = true)
	public Category searchCategory(HashMap<String, Object> map) throws Exception {
		return categoryMapper.searchCategory(map);
	}

	@Transactional
	public int createCategory(Category category) throws Exception {
		return categoryMapper.createCategory(category);
	}

	@Transactional
	public int updateCategory(Category category) throws Exception {
		return categoryMapper.updateCategory(category);
	}

	@Transactional
	public int deleteCategory(HashMap<String, Object> map) throws Exception {
		return categoryMapper.deleteCategory(map);
	}

}
