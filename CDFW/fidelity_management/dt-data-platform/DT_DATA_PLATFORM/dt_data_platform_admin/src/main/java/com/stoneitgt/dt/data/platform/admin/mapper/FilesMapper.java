package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import com.stoneitgt.dt.data.platform.domain.Files;


@Mapper
public interface FilesMapper {

	List<Map<String, Object>> getFileList(Map<String, Object> params);
	List<Map<String, Object>> getDtFileList(Map<String, Object> params);

	Files getFile(int fileSeq);
	Files getDtFile(int fileSeq);

	int insertFile(Files file);
	int insertDtFile(Files file);

	int updateFile(Files file);
	int updateDtFile(Files file);

	int deleteFile(Files files);

	int deleteFileAll(Files files);

	int updateFileTitle(Files file);
	
	int updateThumbFile(Files file);
	
	int updateThumbFileProjectImage(Files file);
	
	int insertDtAugmentFile(Files files);
	Files getDtAugmentFile(int fileSeq);
	int updateDtAugmentFile(Files files);
	
}
