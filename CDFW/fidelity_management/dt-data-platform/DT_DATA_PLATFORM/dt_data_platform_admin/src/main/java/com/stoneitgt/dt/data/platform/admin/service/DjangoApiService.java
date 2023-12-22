package com.stoneitgt.dt.data.platform.admin.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.FileUtil;

@Service
public class DjangoApiService {
	
	@Autowired
	private BaseSystemProperties systemproperties;
	
	public String requestDjangoApi(String url, Map<String, Object> params, int modelSeq) {
		Map<String, Object> result = new HashMap<String, Object>();
		
		RestTemplate restTemplate = new RestTemplate();

		//String url = "http://localhost:8080/dt/learning/modelGenerater_create/";
		String contentType = "application/json";
		String authKey = "Token ae55da7722b9198f7483779f95546379c30e1837";
		
		HttpHeaders headers = new HttpHeaders();
		headers.add("Content-Type",contentType);
		headers.add("Authorization",authKey);
		
		String data_file_path = systemproperties.getDtFilePath().replace("\\", "/") + FileUtil.getUploadDtFilePath(FILE_REF_TYPE.DATA, modelSeq);
		String model_file_path = systemproperties.getDtFilePath().replace("\\", "/") + FileUtil.getUploadDtFilePath(FILE_REF_TYPE.MODEL, modelSeq);
		
		HttpEntity<Map<String, Object>> request = new HttpEntity<>(params, headers);

		ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
		String responseBody = response.getBody();
		result.put("responseBody", responseBody);
		
		
		return responseBody;
	}
	
	
}
