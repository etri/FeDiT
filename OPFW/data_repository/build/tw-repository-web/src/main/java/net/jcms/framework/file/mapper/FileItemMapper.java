package net.jcms.framework.file.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.file.model.FileItem;
import net.jcms.framework.file.model.FileItemSearch;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface FileItemMapper extends BaseMapper<FileItem, FileItemSearch> {

	Long getAutoIncNumber ();

	int selectSerial(String fileId);

	void updateFileId(FileItem fileItem);
	
	void updateDwnCnt(Long itemId);
}
