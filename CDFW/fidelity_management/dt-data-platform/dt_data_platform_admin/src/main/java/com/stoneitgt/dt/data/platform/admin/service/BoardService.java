package com.stoneitgt.dt.data.platform.admin.service;

import com.stoneitgt.dt.data.platform.admin.mapper.BoardMapper;
import com.stoneitgt.dt.data.platform.admin.mapper.FilesMapper;
import com.stoneitgt.dt.data.platform.domain.Board;
import com.stoneitgt.dt.data.platform.domain.Files;
import com.stoneitgt.dt.data.platform.domain.Paging;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class BoardService {

    @Autowired
    private BoardMapper boardMapper;
    @Autowired
    private FilesMapper filesMapper;


    public int saveBoard(Board board) {
        boardMapper.saveBoard(board);
        return board.getBoardSeq();
    }

    public List<Map<String, Object>> getBoardList(Map<String, Object> params, Paging paging) {
        return boardMapper.getBoardList(params, paging.getPaging());
    }

    public List<Map<String, Object>> getBoardListSetUserSeq(Map<String, Object> params, Paging paging) {
        return boardMapper.getBoardListSetUserSeq(params, paging.getPaging());
    }

    public Map<String, Object> getBoardBySeq(String boardSeq) {
        return boardMapper.getBoardBySeq(boardSeq);
    }

    public void deleteBoardByBoardSeqAndType(Board board) {
        boardMapper.deleteBoardByBoardSeqAndType(board);
        Files files = filesMapper.getBoardFile(board.getBoardSeq());
        if (files != null) {
            files.setDelIp(board.getDelIp());
            files.setDelYn("Y");
            files.setDelUserSeq(board.getDelUserSeq());
            filesMapper.deleteBoardFiles(files);
        }
    }

    public void updateBoard(Board board) {
        boardMapper.updateBoard(board);
    }
}
