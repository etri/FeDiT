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
import org.springframework.web.bind.annotation.RestController;

import com.federated.searchRule.restfulApi.util.Constant;
import com.federated.searchRule.restfulApi.util.CreateEntitiy;
import com.federated.searchRule.restfulApi.util.SearchNgsiIdOntology;

/**
 * @파일명 : DigitalTwinBehaviorController.java
 * @작성일 : 2023. 11. 24.
 * @작성자 : 오세광
 * @변경이력 :
 * @description :
 */
@RestController
@RequestMapping("/behavior")
public class DigitalTwinBehaviorController {

	private final Logger logger = LoggerFactory.getLogger(DigitalTwinBehaviorController.class);

	@GetMapping("/searchData")
	public ResponseEntity<JSONObject> searchData(HttpServletRequest request, @RequestBody String searchRules)
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

	@PostMapping("/createBehaviorEntitiy")
	public ResponseEntity<JSONObject> createBehaviorEntitiy(HttpServletRequest request, @RequestBody String bodyStr)
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
		;

		return new ResponseEntity<>(new JSONObject(map), httpHeaders, Constant.HTTP_OK_STAT);
	}

}
