package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import com.stoneitgt.dt.data.platform.domain.Board;
import org.apache.ibatis.annotations.Mapper;

import com.stoneitgt.dt.data.platform.domain.Files;


@Mapper
public interface FilesMapper {

    List<Map<String, Object>> getDtFileList(Map<String, Object> params);

    List<Map<String, Object>> getDtMetaFileList(Map<String, Object> params);

    Files getFile(int fileSeq);

    Files getDtFile(int fileSeq);

    int insertDtFile(Files file);

    int updateDtFile(Files file);

    int deleteFile(Files files);

    int insertDtAugmentFile(Files files);

    Files getDtAugmentFile(int fileSeq);

    int updateDtAugmentFile(Files files);

    int insertMetaDtFile(Files files);

    int insertEtcMetaDtFile(Files files);

    int insertMetaAugmentFile(Files files);

    Files getDtMetaAugmentFile(int fileSeq);

    int insertBoardFile(Files files);

    int updateBoardFile(Files files);

    Files getBoardFile(int boardSeq);

    void deleteBoardFiles(Files files);
}
