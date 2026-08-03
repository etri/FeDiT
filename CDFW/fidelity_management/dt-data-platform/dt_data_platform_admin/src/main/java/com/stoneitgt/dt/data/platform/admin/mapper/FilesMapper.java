package com.stoneitgt.dt.data.platform.admin.mapper;

import com.stoneitgt.dt.data.platform.domain.Files;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;


@Mapper
public interface FilesMapper {

    List<Map<String, Object>> getDtMetaFileList(@Param("refType") String refType, @Param("refSrno") int refSrno);

    Files getDtFile(int fileSeq);

    int insertMetaDtFile(Files files);

    int insertEtcMetaDtFile(Files files);

    int insertMetaAugmentFile(Files files);

    Files getDtMetaAugmentFile(int fileSeq);

    int insertBoardFile(Files files);

    int updateBoardFile(Files files);

    Files getBoardFile(int boardSeq);

    void deleteBoardFiles(Files files);

    Files getDtEtcFile(int fileSeq);

    int insertMetaAugmentVisualFile(Files files);

    ArrayList<Files> getAugmentVisualFilesByAugmentFileSeq(@Param("augmentFileSeq") int augmentFileSeq);
}
