package com.stoneitgt.dt.data.platform.admin.controller;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.stoneitgt.dt.data.platform.admin.service.FilesService;
import com.stoneitgt.dt.data.platform.domain.Files;
import com.stoneitgt.dt.data.platform.util.FileUtil;
import com.stoneitgt.dt.data.platform.util.StringUtil;

import lombok.extern.slf4j.Slf4j;

import com.stoneitgt.common.GlobalConstant;

@Slf4j
@Controller
@RequestMapping("/file")
public class FilesController extends BaseController {

	@Autowired
	private FilesService filesService;

	//@GetMapping("/download/{fileSeq}")
	public void retrieve2(@PathVariable int fileSeq, HttpServletRequest request, HttpServletResponse response)
			throws IOException {

		Files files = filesService.getFile(fileSeq);

		if (files == null) {
			return;
		}

		File file = new File(systemProperties.getUploadFilePath() + files.getFilePath());

		if (StringUtil.isNoneBlank(files.getFileContsTp())) {
			response.setContentType(files.getFileContsTp());
		}

		FileUtil.outputStreamFile(file, files.getFileNm(), response, request);
	}

	//20210528 save_file_name 컬럼 추가로 인한 조정
	@GetMapping("/download/{fileSeq}")
	public void retrieve(@PathVariable int fileSeq, HttpServletRequest request, HttpServletResponse response)
			throws IOException {

		Files files = filesService.getFile(fileSeq);

		if (files == null) {
			return;
		}

		File file = new File(systemProperties.getUploadFilePath() + files.getFilePath() + files.getStrgFileNm());

		if (StringUtil.isNoneBlank(files.getFileContsTp())) {
			response.setContentType(files.getFileContsTp());
		}

		FileUtil.outputStreamFile(file, files.getFileNm(), response, request);
	}

	
	@GetMapping("/download/dt/{fileSeq}")
	public void dtDownloadFile(@PathVariable int fileSeq, HttpServletRequest request, HttpServletResponse response)
			throws IOException {

		Files files = filesService.getDtFile(fileSeq);

		if (files == null) {
			return;
		}

		//log.info("file::" + systemProperties.getDtFilePath() + files.getFilePath() + files.getFileNm());
		File file = new File(systemProperties.getDtFilePath() + files.getFilePath() + files.getFileNm());

		if (StringUtil.isNoneBlank(files.getFileContsTp())) {
			response.setContentType(files.getFileContsTp());
		}

		FileUtil.outputStreamFile(file, files.getFileNm(), response, request);
	}
	
	@GetMapping("/download/dt/augment/{fileSeq}")
	public void dtDownloadAugmentFile(@PathVariable int fileSeq, HttpServletRequest request, HttpServletResponse response)
			throws IOException {

		Files files = filesService.getDtAugmentFile(fileSeq);

		if (files == null) {
			return;
		}

		//log.info("file::" + systemProperties.getDtFilePath() + files.getFilePath() + files.getFileNm());
		File file = new File(systemProperties.getDtFilePath() + files.getFilePath() + "/" + files.getStrgFileNm());
		
		if (StringUtil.isNoneBlank(files.getFileContsTp())) {
			response.setContentType(files.getFileContsTp());
		}

		FileUtil.outputStreamFile(file, files.getFileNm(), response, request);
	}	
	
	@GetMapping("/static/{fileSeq}")
	public void staticFile(@PathVariable int fileSeq, HttpServletRequest request, HttpServletResponse response)
			throws Exception {

//		Map<String, Object> fileInfo = filesService.getFile(fileSeq);
//
//		if (fileInfo == null) {
//			throw new Exception("Not found file!");
//		}
//
//		String filepath = systemProperties.getStaticFilePath();
//
//		log.info("fileInfo : " + fileInfo);
//
//		File file = new File(filepath + fileInfo.get("file_path").toString());
//
//		FileUtil.outputStreamFile(file, fileInfo.get("file_name").toString(), response, request);
	}

	@PostMapping("/delete")
	@ResponseBody
	public Map<String, Object> deleteFile(@RequestBody Files files, HttpServletRequest request) {
		files.setLoginUserSeq(getSessionLoginUserSeq(request));
		files.setLoginUserIp(getClientIP(request));
		filesService.deleteFile(files);
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
		return result;
	}
}
