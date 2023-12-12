package kr.udt.file.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class UdtFileUtil {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(UdtFileUtil.class);
	
	public Map<String, Object> uploadFileFromMultipart(MultipartFile multiFile,String uploadRootPath){
		
		Map<String, Object> uploadFileInfo = new HashMap<String,Object>();
		try {	
			String originFilename = multiFile.getOriginalFilename();
	        String extName = originFilename.substring(originFilename.lastIndexOf("."),originFilename.length());
	        long size = multiFile.getSize();//Byte
	        String saveFileName = genSaveFileName(originFilename);
	        String uploadPath = uploadRootPath+genYYYYMMDDDirectory();
	        //uploadPath = changeDirecByOs(uploadPath);
	        
	        LOGGER.info("["+originFilename+"]파일을 업로드합니다.\n"
	        		+ "저장경로 : "+uploadPath+" 저장파일명  : "+saveFileName+" 파일크기 : "+size+"(byte)" );
	        
	        if(!multiFile.isEmpty())
	        {
	        	File dirs = new File(uploadPath);
	        	if(!dirs.isDirectory()) {
	        		if(dirs.mkdirs()) {
	        			LOGGER.debug("경로생성");
	        		}else {
	        			LOGGER.error("에러발생");
	        		}
	        	}
	            File file = new File(uploadPath, saveFileName);
	            
					multiFile.transferTo(file);
	        }
	        
	        uploadFileInfo.put("originFilename",originFilename);
	        uploadFileInfo.put("saveUploadPath",uploadPath);
	        uploadFileInfo.put("saveFileName",saveFileName);
	        uploadFileInfo.put("fileFullPath",uploadPath+saveFileName);
	        uploadFileInfo.put("extName",extName);
	        uploadFileInfo.put("fileSize",size);
		}catch(IOException e) {
			LOGGER.error("에러발생");
		}catch(NullPointerException e) {
			LOGGER.error("에러발생");
		}
		return uploadFileInfo;
	}
	
    private String genSaveFileName(String orgFileName) {
        String fileName="";
        Calendar calendar = Calendar.getInstance();
        fileName += calendar.get(Calendar.YEAR);
        fileName += calendar.get(Calendar.MONTH);
        fileName += calendar.get(Calendar.DATE);
        fileName += calendar.get(Calendar.HOUR);
        fileName += calendar.get(Calendar.MINUTE);
        fileName += calendar.get(Calendar.SECOND);
        fileName += calendar.get(Calendar.MILLISECOND);
        fileName += "_"+orgFileName;

        return fileName;
    }
    
    private String genYYYYMMDDDirectory() {
    	  Calendar cal = Calendar.getInstance();
    	  String dateString;
    	  dateString = String.format("%04d/%02d/%02d/", cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH));
    	  return dateString;
    }
    
    
	public List<String[]> readTextFile(String fullFilePath, String separator){
    	
		File file = null;
		BufferedReader br = null;
        
        List<String[]> dataList = new ArrayList<String[]>();    
        
        int rowCount =0;
        
        try {
        	
        	file=new File(fullFilePath);
        	br=new BufferedReader(new InputStreamReader(new FileInputStream(file),"euc-kr"));

        	String line=null;
        	while((line=br.readLine()) != null){
        		 String row = line;
                 rowCount++;
                 String[] rowCols = row.split(separator,-1);
                 dataList.add(rowCols);
        	}

         
            
        } catch (IOException e) {
        	LOGGER.error("에러발생");
        } catch(NullPointerException e) {
			LOGGER.error("에러발생");
		}
 
        finally {        	
            if (br != null) {try {br.close();} catch (IOException e) {LOGGER.error("에러발생");}}
        }
        
        return dataList;
    }
}
