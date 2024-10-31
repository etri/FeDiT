package net.jcms.framework.file.model;

import net.jcms.framework.base.model.BaseModel;

import java.util.List;

public class FileInfo extends BaseModel{

	private Long fileId;
	
	public List<FileItem> fileList;

	public Long getFileId() {
		return fileId;
	}

	public void setFileId(Long fileId) {
		this.fileId = fileId;
	}

}
