package com.stoneitgt.dt.data.platform.admin.controller;

import java.io.IOException;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.stoneitgt.dt.data.platform.admin.service.ResourceService;
import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequestMapping("/resource")
public class ResourceController extends BaseController {
	
	@Autowired
	private ResourceService resourceService;
	
	@PostMapping(value="/imageFileUpload", produces = "application/json")
	@ResponseBody
	public HashMap<String, Object> uploadSummernoteImageFile(@RequestParam("file") MultipartFile multipartFile, @RequestParam("type") String type) 
			throws IOException {		
		return resourceService.saveResource(multipartFile, type, FILE_REF_TYPE.RESOURCE, authenticationFacade.getLoginUserSeq(), authenticationFacade.getLoginUserIp());		
	}
}
