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
package kr.udt.file.service.impl;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.Reader;
import java.io.Writer;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import egovframework.rte.fdl.cmmn.EgovAbstractServiceImpl;
import egovframework.rte.psl.dataaccess.util.EgovMap;
import kr.udt.file.service.SrcDataInsertVO;
import kr.udt.file.service.UdtFileService;
import kr.udt.file.util.UdtFileUtil;


@Service("udtFileService")
public class UdtFileServiceImpl extends EgovAbstractServiceImpl implements UdtFileService {

	private static final Logger LOGGER = LoggerFactory.getLogger(UdtFileServiceImpl.class);
	
	@Resource(name="udtFileMapper")
	private UdtFileMapper dao;
	
	@Autowired
	private Properties property;
	
	@Autowired
	UdtFileUtil udtFileUtil;
	
	int bulkInsertLimit = 700;
	
	@Override
	public List<EgovMap> selectSrcTableInfo(){
		return dao.selectSrcTableInfo();
	}
	/* 
	 * 재료데이터 업로드절차
	 * STEP1 : 파일업로드(글로벌프로퍼티의 SRCDATA저장경로/테이블명/년/월/일/save파일명
	 * STEP2 : 현재 원본재료테이블에 있는 데이터 그대로 BACKUP테이블로 인서트(BACK_테이블명, PK없음)
	 * STEP3 : 원본재료테이블 TRUNCATE
	 * STEP4 : 업로드된 TXT 원본테이블로 INSERT
	 * STEP5 : INSERT된 로우들 동일한 타임스탬프로 UPDATE
	 * STEP6 : 1~5까지 문제없었을 경우만 step1에서 등록한 파일info db에저장
	 * STEP7 : 6번에서 발급된 파일아이디로 TBINFO_SRC_DATA의 LATELY_FILE_ID컬럼 UPDATE
	 * STEP8 : 6번에서 발급된 파일아이디로  TBINFO_SRC_DATA_FILE_HST 파일아이디 백업저장
	 * *IMPL 클래스의 모든 메서드들은 트랜잭션 AOP가 걸려있기떄문에 어떤 부분에서 에러가 나더라도 DB내용은 자동 ROLLBACK되는 형국 
	 */
	@Override
	@Transactional
	public Map<String,Object> saveNewlySrcDataFileToDb(MultipartFile multiFile, String srcDataTbNm, boolean isContainHeader) {
		Map<String, Object> returnMap = new HashMap<String,Object>(); 
		
		//@Transactional(AOP설정되있음)을 이용해 자동롤백을 하기위해 TRY CATCH는 하지않고 그대로 에러를 뱉는다. 
		String srcDataFileRootPath = property.getProperty("File.Dir.SrcData");
		String filePath = srcDataFileRootPath+srcDataTbNm+"/";
		String separator ="\\|";
		//공공주택 관련 원천데이터셋(1~4)은 구분자'|', 청약관련 데이터셋(5~7)은 구분자 탭('\t')
		if(srcDataTbNm.replaceFirst("SRCDATA_", "").toUpperCase().startsWith("APPLYHOME")) {
			separator="\t";
			isContainHeader=true;
		}
		
		Map<String, Object> uploadFileInfo = udtFileUtil.uploadFileFromMultipart(multiFile,filePath);
		if(uploadFileInfo.size()!=0) {
			uploadFileInfo.put("tbNm", srcDataTbNm);
			String fileFullPath = (String)uploadFileInfo.get("fileFullPath");
			String[] header = null;
			List<String[]> dataList = null;
			if(isContainHeader) {
				List<String[]> temp = udtFileUtil.readTextFile(fileFullPath, separator);
				header=temp.get(0);
				dataList=new ArrayList<String[]>(temp.subList(1, temp.size()));
			}else {
				header = dao.selectTbColNms(srcDataTbNm);
				dataList = udtFileUtil.readTextFile(fileFullPath, separator);
			}
			SrcDataInsertVO bulkInsertVo = new SrcDataInsertVO();
			bulkInsertVo.setTbNm(srcDataTbNm);
			bulkInsertVo.setHeader(header);
			
			dao.bulkInsertBackupSrcDataTable(bulkInsertVo);//백업테이블 insert
			dao.truncateSrcDataTable(bulkInsertVo);//원본 테이블 비우기
			//if(1==1)throw new NullPointerException("멈춰라얍");//롤백테스트
			int insertCount=0;
			if(dataList.size()>bulkInsertLimit) { //벌크처리
				//(포스트그래스 파라미터 최대 32767개만 가능, 컬럼이 40개고 400줄드가면 파라미터 16000개임, 근데 컬럼41개짜리있음ㅋ)
				int currCount=0;
				int mok = dataList.size()/bulkInsertLimit;
				int nam = dataList.size()%bulkInsertLimit;
				if(nam>0)mok=mok+1;
				
				for(int i=0; i<mok; i++) {
					
					int endListIndex=0;
					if(i==mok-1) {
						endListIndex=bulkInsertLimit*(i)+nam;
					}
					else {
						endListIndex=bulkInsertLimit*(i+1);
					}
					
					List<String[]> subDataList=new ArrayList<String[]>(dataList.subList(currCount, endListIndex));
					bulkInsertVo.setRows(subDataList);
					insertCount = insertCount+dao.bulkInsertNewlySrcData(bulkInsertVo);//원본 insert
					currCount=currCount+bulkInsertLimit;
					try{Thread.sleep(50);}catch(InterruptedException e) {LOGGER.error("에러발생");}
					
				}
			}else {
				bulkInsertVo.setRows(dataList);
				insertCount = dao.bulkInsertNewlySrcData(bulkInsertVo);//원본 insert
			}
			
			dao.bulkUpdateNewlySrcDataTimestamp(bulkInsertVo);//원본 타임스탬프 update
			uploadFileInfo.put("fileId", null);
			uploadFileInfo.put("fileType", "UDT_ULD");
			dao.insertUdtFile(uploadFileInfo);//파일 INFO DB저장
			int fileId = ((Long)uploadFileInfo.get("fileId")).intValue();
			
			Map<String,Object> updtSrcInfoParamMap = new HashMap<String,Object>();
			updtSrcInfoParamMap.put("fileId", fileId);
			updtSrcInfoParamMap.put("timeStmp", bulkInsertVo.getTimestamp());
			updtSrcInfoParamMap.put("srcTbNm", srcDataTbNm);
			updtSrcInfoParamMap.put("rowCnt", insertCount);
			dao.updateSrcTableInfo(updtSrcInfoParamMap); //소스데이터 INFO테이블에 최신 타임스탬프,최신 파일아이디 갱신
			dao.insertSrcTableDataFileHst(updtSrcInfoParamMap);//원본소스 파일이력테이블 저장
			
			returnMap.put("fileId",fileId);
			returnMap.put("timeStmp", bulkInsertVo.getTimestampString());
		}
		return returnMap;
	}
	
	@Override
	public void fileDownload(String fileId,String fileSn, HttpServletRequest request,HttpServletResponse response, boolean encodingAt) {
		
		File file = null;
	    FileInputStream fileInputStream = null;
	    OutputStream out  = null;
	    PrintWriter writer=null;
	    String tempFile = null;
	    
		try {
			Map<String,Object> fileIdInfo = new HashMap<String,Object>();
			fileIdInfo.put("fileId", fileId);
			fileIdInfo.put("fileSn", fileSn);
			List<EgovMap>fileList = dao.selectOneUdtFile(fileIdInfo);
			
			if(fileList.size()==0) throw new IOException("파일이 존재하지 않습니다. 입력 파일아이디 :["+fileId+"]");
			
        	String path = (String)fileList.get(0).get("fileDir");
        	String saveFileNm =(String)fileList.get(0).get("fileSaveNm");
        	
        	String mimeType = request.getServletContext().getMimeType(path+saveFileNm);
        	if(mimeType==null)mimeType="application/octet-stream";
        	
        	if(encodingAt) {
        		tempFile = path+"/"+UUID.randomUUID().toString();
        		tempFile = encodingFile(path+"/"+saveFileNm,tempFile,"utf-8","MS949");
        		file = new File(tempFile);
        	}else file = new File(path+"/"+saveFileNm);
        	
        	
        	fileInputStream = new FileInputStream(file); 
        	String downFileNm = URLEncoder.encode((String)fileList.get(0).get("fileOrgNm"),"UTF-8").replaceAll("\\+", "%20");
        	response.setHeader("Content-Disposition", "attachment;filename=" + downFileNm);
        	response.setContentType(mimeType);
        	
        	out = response.getOutputStream();
        	
        	int read = 0;
                byte[] buffer = new byte[1024];
                while ((read = fileInputStream.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
            }
            
            
                
        } catch (IOException e) {
        	LOGGER.error("에러발생");
			try {
				response.setContentType("text/html; charset=UTF-8");
				writer = response.getWriter();
				writer.println("<script>alert('파일 다운로드중 오류가 발생하였습니다.관리자에게 문의해주세요.'); history.back();</script>");
				writer.flush();
			} catch (IOException e1) {
				if(writer!=null) {
					writer.close();
				}				
			}
        }catch(NullPointerException e) {
			LOGGER.error("에러발생");
		} finally {
        	try {
        		if(fileInputStream!=null) fileInputStream.close();
        		if(out!=null) out.close();
	        	if(encodingAt&&tempFile!=null) {
	        		File t = new File(tempFile);
	        		if(t.exists()) {
	        			if(t.delete()) {
	        				LOGGER.debug("삭제성공");
	        			}else {
	        				LOGGER.error("에러발생");
	        			}
	        		}
	        	}
        	}catch(IOException e) {LOGGER.error("에러발생");
        	}catch(NullPointerException e) {
    			LOGGER.error("에러발생");
    		}
        }
	}
	
	public List<EgovMap> selectOneUdtFile(Map fileIdInfo){
		return dao.selectOneUdtFile(fileIdInfo);
	}
	
	@Override
	public String encodingFile(String srcFilePath,String destFilePath, String srcEncoding, String destEncoding) throws IOException {
				
		File srcFile = null;
		File destFile = null;
		
	    FileInputStream fileInputStream = null;
	    
	    FileOutputStream fos = null;
	    Writer ioWriter = null;
	    Reader reader = null;
	    InputStreamReader isr = null;
	    
	    StringBuffer stringBuffer = new StringBuffer();
	    
		try {
			
        
			srcFile = new File(srcFilePath);
			destFile = new File(destFilePath);
        	
        	fileInputStream = new FileInputStream(srcFile);
        	Charset inputCharset = Charset.forName(srcEncoding);
        	isr = new InputStreamReader(fileInputStream, inputCharset);
        	reader = new BufferedReader(isr);
        	
        	int intRead = 0;
        	
        	while((intRead=reader.read())>-1) {
        		stringBuffer.append((char)intRead);
        	}
        
        	fos = new FileOutputStream(destFile);
        	
        	ioWriter = new OutputStreamWriter(fos,destEncoding);
        	ioWriter.write(stringBuffer.toString());
        	stringBuffer.setLength(0);
        	
        } catch (IOException e) {
        	LOGGER.error("에러발생");
			throw e;
        }catch(NullPointerException e) {
			LOGGER.error("에러발생");
		} finally {
        	try {
        		if(ioWriter!=null)ioWriter.close();
        		if(reader!=null)reader.close();
        		if(isr!=null)isr.close();
        		if(fileInputStream!=null)fileInputStream.close();
        	}catch(IOException e) {LOGGER.error("에러발생");
        	}catch(NullPointerException e) {
    			LOGGER.error("에러발생");
    		}
        }
		
		return destFilePath;
	}
	@Override
	public List<EgovMap> selectSrcDataFileHstByTbNm(Map parameters) {

		return dao.selectSrcDataFileHstByTbNm(parameters);
	}
}
