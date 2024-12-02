/*
 * Copyright 2008-2009 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package kr.udt.file.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.web.multipart.MultipartFile;

import egovframework.rte.psl.dataaccess.util.EgovMap;

public interface UdtFileService {
	
	public Map<String,Object> saveNewlySrcDataFileToDb(MultipartFile multiFile, String srcFileId, boolean isContainHeader);
	
	public List<EgovMap> selectSrcTableInfo();
	
	public void fileDownload(String fileId,String fileSn,HttpServletRequest request,HttpServletResponse response,boolean encodingAt);
	
	public List<EgovMap> selectOneUdtFile(Map fileIdInfo);
	
	public String encodingFile(String srcFilePath,String destFilePath, String srcEncoding, String destEncoding)  throws IOException;
	
	public List<EgovMap> selectSrcDataFileHstByTbNm(Map parameters);
}
