package net.jcms.framework.file.service;

import net.jcms.framework.base.service.BaseService;
import net.jcms.framework.file.model.FileItem;
import net.jcms.framework.file.model.FileItemSearch;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileItemService extends BaseService<FileItem, FileItemSearch> {

	Long getAutoIncNumber();

	public String getUpDirectoryPath(FileItem fileItem);

	void updateFileId(FileItem fileItem);
	void updateDwnCnt(Long itemId);

	public int deleteFileById(Long itemId);
	public FileItem saveFile(MultipartFile uploadFile) throws IOException;
	public FileItem saveFileWithUpDirectory(MultipartFile uploadFile, String upDirectory) throws IOException;
	public FileItem updateFile(MultipartFile fileMf, Long itemId) throws IOException;
}
