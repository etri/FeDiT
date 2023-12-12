package com.stoneitgt.dt.data.platform.admin.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.activation.MimetypesFileTypeMap;

import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.admin.mapper.FilesMapper;
import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.domain.Files;
import com.stoneitgt.dt.data.platform.util.FileUtil;

import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;

@Slf4j
@Service
public class FilesService {

	@Autowired
	private SystemProperties systemProperties;

	@Autowired
	private FilesMapper filesMapper;

	public List<Map<String, Object>> getFileList(Map<String, Object> params) {
		return filesMapper.getFileList(params);
	}

	public List<Map<String, Object>> getDtFileList(Map<String, Object> params) {
		return filesMapper.getDtFileList(params);
	}
	
	
	public Files getFile(int fileSeq) {
		return filesMapper.getFile(fileSeq);
	}
	
	public Files getDtFile(int fileSeq) {
		return filesMapper.getDtFile(fileSeq);
	}

	public int deleteFile(Files files) {
		return filesMapper.deleteFile(files);
	}

	public int deleteFileAll(Files files) {
		return filesMapper.deleteFileAll(files);
	}
	
	public int saveFiles(MultipartFile attachFile, String directory) throws IOException {
		return saveFiles(attachFile, null, directory, 0, 0, null);
	}
	
	public int saveFiles(MultipartFile attachFile, String directory, int refSeq, int loginUserSeq) throws IOException {
		return saveFiles(attachFile, null, directory, refSeq, loginUserSeq, null);
	}
	
	public int saveFiles(MultipartFile attachFile, String directory, int refSeq, int loginUserSeq, String loginUserIp) throws IOException {
		return saveFiles(attachFile, null, directory, refSeq, loginUserSeq, loginUserIp);
	}
	
	public int saveFiles2(MultipartFile attachFile, String fileTitle, String directory, int refSeq, int loginUserSeq, String loginUserIp)
			throws IOException {

		long fileSize = attachFile.getSize();

		if (fileSize > 0) {
			Files files = new Files();
			files.setFileNm(attachFile.getOriginalFilename());
			files.setFileSz(fileSize);
			//files.setFileByte(FileUtil.sizeOfAsString(fileSize));
			files.setRefTp(FILE_REF_TYPE.ORIGIN.toUpperCase());
			files.setRefSeq(refSeq);
			files.setFileExtn(FileUtil.getFileExtension(files.getFileNm()));
			files.setFileTitle(fileTitle);
			files.setLoginUserSeq(loginUserSeq);
			files.setLoginUserIp(loginUserIp);

			filesMapper.insertFile(files);

			String filePath = FileUtil.getUploadFilePath(directory);
			files.setFilePath(filePath + files.getFileSeq());

			File file = FileUtil.uploadFile(systemProperties.getUploadFilePath() + files.getFilePath(), attachFile);
			files.setFileContsTp(FileUtil.getFileContentType(file));

			filesMapper.updateFile(files);

			return files.getFileSeq();
		}

		return 0;
	}

	//이미지는 썸네일 추가로 변경된 메소드
	public int saveFiles(MultipartFile attachFile, String fileTitle, String directory, int refSeq, int loginUserSeq, String loginUserIp)
			throws IOException {

		long fileSize = attachFile.getSize();
		
		if (fileSize > 0) {
			Files files = new Files();
			files.setFileNm(attachFile.getOriginalFilename());
			files.setFileSz(fileSize);
			//files.setFileByte(FileUtil.sizeOfAsString(fileSize));
			files.setRefTp(FILE_REF_TYPE.ORIGIN.toUpperCase());
			files.setRefSeq(refSeq);
			files.setFileExtn(FileUtil.getFileExtension(files.getFileNm()));
			files.setFileTitle(fileTitle);
			files.setLoginUserSeq(loginUserSeq);
			files.setLoginUserIp(loginUserIp);

			filesMapper.insertFile(files);
		
			String filePath = FileUtil.getUploadFilePath(directory);
			//files.setFilePath(filePath + files.getFileSeq());
			files.setFilePath(filePath);

			files.setStrgFileNm(files.getFileSeq() +  "." + FilenameUtils.getExtension(attachFile.getOriginalFilename()));
			
			FileUtil.uploadFile2(systemProperties.getUploadFilePath() + files.getFilePath(), files.getStrgFileNm(), attachFile);
			//File file = FileUtil.uploadFile2(systemProperties.getUploadFilePath() + files.getFilePath(), files.getStrgFileNm(), attachFile);
			//files.setFileContentType(FileUtil.getFileContentType(file));

			String thumbFilePath = FileUtil.getUploadFilePath(directory + "/thumb");
			File thumbDirectory = new File(systemProperties.getUploadFilePath() + File.separator +  thumbFilePath);
			
			if (!thumbDirectory.exists()) {
				thumbDirectory.mkdirs();
			}
			
			//썸네일 lib (만들수 있는 파일 체크가 아닌 에러를 보냄) : 썸네일 생성시 썸네일을 못만드는 파일은 try/catch 로 null값을 보냄
			try {
				Thumbnails.of(systemProperties.getUploadFilePath() + files.getFilePath() + files.getStrgFileNm())
				.size(1920, 1080)
				.toFile(new File(thumbDirectory + "/L_" + files.getStrgFileNm()));
				
				files.setThumbL(thumbFilePath + "L_" + files.getStrgFileNm());
			} catch (Exception e) {
				files.setThumbL("");
			}
			
			try {
				Thumbnails.of(systemProperties.getUploadFilePath() + files.getFilePath() + files.getStrgFileNm())
				.size(1280, 720)
				.toFile(new File(thumbDirectory + "/M_" + files.getStrgFileNm()));
				
				files.setThumbM(thumbFilePath + "M_" + files.getStrgFileNm());
			} catch (Exception e) {
				files.setThumbM("");
			}
			
			try {
				Thumbnails.of(systemProperties.getUploadFilePath() + files.getFilePath() + files.getStrgFileNm())
				.size(640, 360)
				.toFile(new File(thumbDirectory + "/S_" + files.getStrgFileNm()));
				
				files.setThumbS(thumbFilePath + "S_" + files.getStrgFileNm());
			} catch (Exception e) {
				files.setThumbS("");
			}			
			
			filesMapper.updateFile(files);

			return files.getFileSeq();
		}

		return 0;
	}
	
	
	public int saveDtFiles(MultipartFile attachFile, String directory, int refSeq, int loginUserSeq, int modelSeq, String loginUserIp) throws IOException {
		return saveDtFiles(attachFile, null, directory, refSeq, loginUserSeq, modelSeq, loginUserIp);
	}
	
	public int saveDtFiles(MultipartFile attachFile, String fileTitle, String directory, int refSeq, int loginUserSeq, int modelSeq, String loginUserIp)
			throws IOException {

		long fileSize = attachFile.getSize();
		
		if (fileSize > 0) {
			Files files = new Files();
			files.setFileNm(attachFile.getOriginalFilename());
			files.setStrgFileNm(attachFile.getOriginalFilename());
			files.setFileSz(fileSize);
			//files.setFileByte(FileUtil.sizeOfAsString(fileSize));
			files.setRefTp(FILE_REF_TYPE.ORIGIN.toUpperCase());
			files.setRefSeq(refSeq);
			files.setFileExtn(FileUtil.getFileExtension(files.getFileNm()));
			files.setFileTitle(fileTitle);
			files.setLoginUserSeq(loginUserSeq);
			//files.setLoginUserId(loginUserId);
			files.setModelSeq(modelSeq);
			files.setLoginUserIp(loginUserIp);

			//log.info("attachFile.getOriginalFilename()::" + attachFile.getOriginalFilename());
			filesMapper.insertDtFile(files);
			String filePath = FileUtil.getUploadDtFilePath(directory, files.getModelSeq());
			//files.setFilePath(filePath + files.getFileSeq());
			files.setFilePath(filePath);

			//files.setStrgFileNm(files.getFileSeq() +  "." + FilenameUtils.getExtension(attachFile.getOriginalFilename()));
			files.setFileNm(files.getFileSeq() + "_" + attachFile.getOriginalFilename());
			
			FileUtil.uploadFile2(systemProperties.getDtFilePath() + files.getFilePath(), files.getFileNm(), attachFile);
			//File file = FileUtil.uploadFile2(systemProperties.getUploadFilePath() + files.getFilePath(), files.getStrgFileNm(), attachFile);
			//files.setFileContentType(FileUtil.getFileContentType(file));
			
			filesMapper.updateDtFile(files);

			return files.getFileSeq();
		}

		return 0;
	}
	
	
	public int saveDtAugmentFiles(String fileFullPath, String dir, String prcsLevel, int refSeq, int loginUserSeq, String loginUserIp)
			throws IOException {
			File file = new File(fileFullPath);
		
			Files files = new Files();
			files.setFileNm(file.getName());
			files.setStrgFileNm(file.getName());
			files.setFilePath(dir);
			files.setFileSz(file.length());
			files.setFileExtn(FileUtil.getFileExtension(file.getName()));
			files.setRefTp(FILE_REF_TYPE.AUGMENT.toUpperCase());
			files.setPprcsTp(prcsLevel);
			files.setRefSeq(refSeq);
			files.setLoginUserSeq(loginUserSeq);
			files.setLoginUserIp(loginUserIp);

			Path savePath = Paths.get(fileFullPath);
			//files.setFileContsTp(new MimetypesFileTypeMap().getContentType(file));
			files.setFileContsTp(java.nio.file.Files.probeContentType(savePath));
			
			filesMapper.insertDtAugmentFile(files);
			
			files.setFileNm(files.getFileSeq() + "_" + file.getName());
			filesMapper.updateDtAugmentFile(files);
			
		return files.getFileSeq();
	}	
	
	
	
	public int updateFileTitle(Files file) {
		return filesMapper.updateFileTitle(file);
	}

	public Files getDtAugmentFile(int fileSeq) {
		return filesMapper.getDtAugmentFile(fileSeq);
	}
}
