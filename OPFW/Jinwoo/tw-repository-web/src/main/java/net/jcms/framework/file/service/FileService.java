package net.jcms.framework.file.service;

import net.jcms.framework.base.service.BaseService;
import net.jcms.framework.file.model.FileInfo;
import net.jcms.framework.file.model.FileSearch;

public interface FileService extends BaseService<FileInfo, FileSearch> {

	void deleteFileItem(Long fileId);
	
}
