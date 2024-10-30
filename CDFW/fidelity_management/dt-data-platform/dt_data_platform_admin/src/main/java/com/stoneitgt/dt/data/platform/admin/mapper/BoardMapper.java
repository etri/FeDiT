package com.stoneitgt.dt.data.platform.admin.mapper;

import com.stoneitgt.dt.data.platform.domain.Board;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.session.RowBounds;

import java.util.List;
import java.util.Map;

@Mapper
public interface BoardMapper {
    void saveBoard(Board board);

    List<Map<String, Object>> getBoardList(Map<String, Object> params, RowBounds paging);

    List<Map<String, Object>> getBoardListSetUserSeq(Map<String, Object> params, RowBounds paging);

    Map<String, Object> getBoardBySeq(String boardSeq);

    void deleteBoardByBoardSeqAndType(Board board);

    void updateBoard(Board board);
}
