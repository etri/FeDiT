package com.federated.searchRule.restfulApi.controller;

import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.federated.searchRule.restfulApi.service.CategoryService;
import com.federated.searchRule.restfulApi.util.Constant;
import com.federated.searchRule.restfulApi.util.CreateEntitiy;
import com.federated.searchRule.restfulApi.util.SearchNgsiIdOntology;

import io.swagger.annotations.ApiOperation;

/**
 * @파일명 : CategoryController.java
 * @작성일 : 2023. 11. 24.
 * @작성자 : 오세광
 * @변경이력 :
 * @description :
 */
@RestController
@RequestMapping("/category")
public class CategoryController {

	private final CategoryService categoryService;
	private final Logger logger = LoggerFactory.getLogger(CategoryController.class);

	public CategoryController(CategoryService categoryService) {
		this.categoryService = categoryService;
	}

	@ApiOperation(value = "조회 인터페이스", notes = "GET param 데이터 전송")
	@GetMapping("/searchData")
	public ResponseEntity<JSONObject> searchData(HttpServletRequest request, @RequestParam String searchRules)
			throws Exception {

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));
		HashMap<String, Object> map = new HashMap<>();

		SearchNgsiIdOntology search = new SearchNgsiIdOntology();
		JSONObject searchData = search.searchData(searchRules);
		if (searchData == null)
			throw new Exception("******searchData error******");

		map.clear();
		map.put("statusCode", Constant.HTTP_OK_CODE);
		map.put("search_results", searchData);
		map.put("httpStatus", Constant.HTTP_OK_STAT);

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, Constant.HTTP_OK_STAT);
	}

	@ApiOperation(value = "생성 인터페이스", notes = "POST body 데이터 전송")
	@PostMapping("/createCategoryEntitiy")
	public ResponseEntity<JSONObject> category(HttpServletRequest request, @RequestBody String bodyStr)
			throws Exception {

		logger.info("================ createTaskEntitiy Data ==============");

		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", request.getHeader("Content-Type"));
		HashMap<String, Object> map = new HashMap<>();

		CreateEntitiy create = new CreateEntitiy();

		String resultData = create.createData(bodyStr);

		if (resultData == null)
			throw new Exception("*** create error***");

		map.clear();
		map.put("statusCode", Constant.HTTP_OK_CODE);
		map.put("httpStatus", Constant.HTTP_OK_STAT);

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, Constant.HTTP_OK_STAT);
	}

}
