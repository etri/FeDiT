package net.jcms.framework.file.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.file.mapper.FileItemMapper;
import net.jcms.framework.file.model.FileItem;
import net.jcms.framework.file.model.FileItemSearch;
import net.jcms.framework.file.service.FileItemService;
import net.jcms.framework.util.FileUtil;
import net.jcms.framework.util.PropertiesUtil;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service(value="fileItemService")
public class FileItemServiceImpl extends BaseServiceAbst<FileItem, FileItemSearch, FileItemMapper> implements FileItemService {

	@Value("${AppConf.files.dir}")
	private String filesDirectory;

	@Override
	public Long getAutoIncNumber() {
		return mapper.getAutoIncNumber();
	}

	@Override
	public String getUpDirectoryPath(FileItem fileItem) {
		Path directoryPath = Paths.get(filesDirectory, fileItem.getSavePath());
		return directoryPath.toString();
	}

	@Override
	@Resource (name="fileItemMapper")
	protected void setMapper (FileItemMapper mapper) {
		super.setMapper (mapper);
	}

	public FileItem updateFile(MultipartFile fileMf, Long itemId) throws IOException {
		FileItemSearch fileItemSearch = new FileItemSearch();
		fileItemSearch.setItemId(itemId);
		FileItem fileItem = select(fileItemSearch);

		String fileName = fileMf.getOriginalFilename();
		String[] extension = fileName.split("[.]");

		fileItem.setFileNm(fileName);
		fileItem.setFileSize((int)(fileMf.getSize()/1024));
		fileItem.setMediaTp(fileMf.getContentType());
		fileItem.setFileExt(extension[extension.length-1]);
		fileItem.setUpdId(getUserId());
		update(fileItem);

		FileUtil.updateFile(fileMf, getUpDirectoryPath(fileItem), fileItem.getSaveFileNm());

		return fileItem;
	}

	public FileItem saveFileWithUpDirectory(MultipartFile uploadFile, String upDirectory) throws IOException {


		String saveFileName = uploadFile.getOriginalFilename();
		String[] extension = saveFileName.split("[.]");
//		String saveFileName = CustomUUID.createSequentialUUID().toString();
		//String filePath = PropertiesUtil.getProperty("AppConf.filePath.icon");
		//System.out.println("111 = " + filePath);
		FileItem fileItem = new FileItem();

		fileItem.setFileNm(saveFileName);
		fileItem.setFileSize((int)(uploadFile.getSize()/1024));
		fileItem.setMediaTp(uploadFile.getContentType());
		fileItem.setFileExt(extension[extension.length-1]);
		fileItem.setSavePath(upDirectory);
		fileItem.setSaveFileNm(saveFileName);
		fileItem.setRegId(getUserId());
		int count = insert(fileItem);
		if(count != 1) {
			throw new CustomException(ErrorStatus.E_COMMON__UNKNOWN, "insert fileItem failed. name: " + fileItem.getFileNm());
		}
		fileItem.setItemId(fileItem.getItemId());

		FileUtil.createFile(uploadFile, getUpDirectoryPath(fileItem), saveFileName);

		return fileItem;
	}

	public FileItem saveFile(MultipartFile uploadFile) throws IOException {
		return saveFileWithUpDirectory(uploadFile, null);
	}

	@Override
	public int delete(FileItem fileItem) {
		try {
			Path directoryPath = Paths.get(getUpDirectoryPath(fileItem));

			File file = new File( directoryPath.resolve(fileItem.getSaveFileNm()).toString());
			if (file.exists()) file.delete();

			if (MediaType.IMAGE_GIF_VALUE.equals(fileItem.getMediaTp())
					|| MediaType.IMAGE_JPEG_VALUE.equals(fileItem.getMediaTp())
					|| MediaType.IMAGE_PNG_VALUE.equals(fileItem.getMediaTp())) {
				//이미지파일일 경우 썸네일이미지도 같이 삭제한다.
				String imgPath = directoryPath.toString() + PropertiesUtil.getProperty("AppConf.filePath.thumb") + fileItem.getSaveFileNm() + PropertiesUtil.getProperty("AppConf.fileNm.thumb");
				imgPath = imgPath.replaceAll("\\.{2,}[/\\\\]", "");
				file = new File(imgPath);
				if (file.exists()) file.delete();
			}
			return super.delete(fileItem);
		}catch(Exception e){
			throw new RuntimeException(e);
		}
	}

	public int deleteFileById(Long itemId){
		FileItemSearch fileItemSearch = new FileItemSearch();
		fileItemSearch.setItemId(itemId);
		FileItem fileItem = select(fileItemSearch);
		if( null != fileItem ){
			return delete(fileItem);
		}
		return 0;
	}

	@Override
	public void updateFileId(FileItem fileItem) {
		mapper.updateFileId(fileItem);
	}

	@Override
	public void updateDwnCnt(Long itemId) {
		mapper.updateDwnCnt(itemId);
	}
}
