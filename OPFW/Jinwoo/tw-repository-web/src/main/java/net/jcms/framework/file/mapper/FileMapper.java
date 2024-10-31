package net.jcms.framework.file.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.file.model.FileInfo;
import net.jcms.framework.file.model.FileSearch;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface FileMapper extends BaseMapper<FileInfo, FileSearch> {
	
}
