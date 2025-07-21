package com.stoneitgt.dt.data.platform.admin.controller;


import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.service.BoardService;
import com.stoneitgt.dt.data.platform.admin.service.FilesService;
import com.stoneitgt.dt.data.platform.domain.BaseParameter;
import com.stoneitgt.dt.data.platform.domain.Board;
import com.stoneitgt.dt.data.platform.domain.Files;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.util.StoneUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.ModelAndView;

import javax.annotation.Nullable;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Controller
@RequestMapping("/dt/board")
public class BoardController extends BaseController {
    @Autowired
    private FilesService filesService;

    @Autowired
    private BoardService boardService;

    @GetMapping("/notice/list")
    public ModelAndView noticeBoardList(HttpServletRequest request, @ModelAttribute BaseParameter params) {
        ModelAndView VIEW = new ModelAndView("pages/board/notice-board");
        VIEW.addObject("menuCd", params.getMenuCd());
        VIEW.addObject("breadcrumb", getBreadcrumb(params.getMenuCd()));
        VIEW.addObject("pageParams", getBaseParameterString(params));

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        paramsMap.put("type", "N");

        log.info("noticeBoardList -> {}", paramsMap);

        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());
        log.info("paging -> {}", paging);

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        if (authenticationFacade.getAuth().equals("AU00")) {
            list = boardService.getBoardList(paramsMap, paging);
            for (Map<String, Object> board : list) {
                board.put("is_delete", true);
            }
        } else {
            paramsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = boardService.getBoardListSetUserSeq(paramsMap, paging);
            for (Map<String, Object> board : list) {
                int reg_user_seq = Integer.parseInt(board.get("reg_user_seq").toString());
                int user_no = getSessionLoginUserSeq(request);
                if (user_no == reg_user_seq) {
                    board.put("is_delete", true);
                } else {
                    board.put("is_delete", false);
                }
            }
        }

        VIEW.addObject("boards", list);
        VIEW.addObject("paging", StoneUtil.setTotalPaging(list, paging));
        VIEW.addObject("params", params);
        return VIEW;
    }

    @GetMapping("/community/list")
    public ModelAndView communityBoardList(HttpServletRequest request, @ModelAttribute BaseParameter params) {
        ModelAndView VIEW = new ModelAndView("pages/board/community-board");
        VIEW.addObject("menuCd", params.getMenuCd());
        VIEW.addObject("breadcrumb", getBreadcrumb(params.getMenuCd()));
        VIEW.addObject("pageParams", getBaseParameterString(params));

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        paramsMap.put("type", "C");

        log.info("communityBoardList -> {}", paramsMap);

        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());
        log.info("paging -> {}", paging);

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        if (authenticationFacade.getAuth().equals("AU00")) {
            list = boardService.getBoardList(paramsMap, paging);
            for (Map<String, Object> board : list) {
                board.put("is_delete", true);
            }
        } else {
            paramsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = boardService.getBoardListSetUserSeq(paramsMap, paging);
            for (Map<String, Object> board : list) {
                int reg_user_seq = Integer.parseInt(board.get("reg_user_seq").toString());
                int user_no = getSessionLoginUserSeq(request);
                if (user_no == reg_user_seq) {
                    board.put("is_delete", true);
                } else {
                    board.put("is_delete", false);
                }
            }
        }

        VIEW.addObject("boards", list);
        VIEW.addObject("paging", StoneUtil.setTotalPaging(list, paging));
        VIEW.addObject("params", params);
        return VIEW;
    }

    @GetMapping("/notice/{board_no}")
    public ModelAndView noticeBoardView(HttpServletRequest request, @ModelAttribute BaseParameter params, @PathVariable String board_no) {
        ModelAndView VIEW = new ModelAndView("pages/board/notice-board-view");
        VIEW.addObject("menuCd", params.getMenuCd());
        VIEW.addObject("breadcrumb", getBreadcrumb(params.getMenuCd()));
        VIEW.addObject("pageParams", getBaseParameterString(params));
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        log.info("noticeBoardView -> {}", paramsMap);
        Map<String, Object> board = boardService.getBoardBySeq(board_no);
        Files files = filesService.getBoardFile(Integer.parseInt(board.get("board_seq").toString()));
        board.put("files", files);
        log.info("board -> {}", board);
        VIEW.addObject("board", board);

        if (authenticationFacade.getAuth().equals("AU00")) {
            VIEW.addObject("is_update", true);
        } else {
            int user_no = getSessionLoginUserSeq(request);
            int reg_user_seq = Integer.parseInt(board.get("reg_user_seq").toString());
            if (user_no == reg_user_seq) {
                VIEW.addObject("is_update", true);
            } else {
                VIEW.addObject("is_update", false);
            }
        }
        return VIEW;
    }

    @GetMapping("/community/{board_no}")
    public ModelAndView communityBoardView(HttpServletRequest request, @ModelAttribute BaseParameter params, @PathVariable String board_no) {
        ModelAndView VIEW = new ModelAndView("pages/board/community-board-view");
        VIEW.addObject("menuCd", params.getMenuCd());
        VIEW.addObject("breadcrumb", getBreadcrumb(params.getMenuCd()));
        VIEW.addObject("pageParams", getBaseParameterString(params));
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        log.info("communityBoardView -> {}", paramsMap);
        Map<String, Object> board = boardService.getBoardBySeq(board_no);
        Files files = filesService.getBoardFile(Integer.parseInt(board.get("board_seq").toString()));
        board.put("files", files);
        log.info("board -> {}", board);
        VIEW.addObject("board", board);
        if (authenticationFacade.getAuth().equals("AU00")) {
            VIEW.addObject("is_update", true);
        } else {
            int user_no = getSessionLoginUserSeq(request);
            int reg_user_seq = Integer.parseInt(board.get("reg_user_seq").toString());
            if (user_no == reg_user_seq) {
                VIEW.addObject("is_update", true);
            } else {
                VIEW.addObject("is_update", false);
            }
        }
        return VIEW;
    }

    @GetMapping("/notice/form")
    public ModelAndView noticeBoardForm(@ModelAttribute BaseParameter params) {
        ModelAndView VIEW = new ModelAndView("pages/board/notice-board-form");
        VIEW.addObject("menuCd", params.getMenuCd());
        VIEW.addObject("breadcrumb", getBreadcrumb(params.getMenuCd()));
        VIEW.addObject("pageParams", getBaseParameterString(params));
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        log.info("noticeBoardForm -> {}", paramsMap);
        return VIEW;
    }

    @GetMapping("/community/form")
    public ModelAndView communityBoardForm(@ModelAttribute BaseParameter params) {
        ModelAndView VIEW = new ModelAndView("pages/board/community-board-form");
        VIEW.addObject("menuCd", params.getMenuCd());
        VIEW.addObject("breadcrumb", getBreadcrumb(params.getMenuCd()));
        VIEW.addObject("pageParams", getBaseParameterString(params));
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        log.info("communityBoardForm -> {}", paramsMap);
        return VIEW;
    }

    @GetMapping("/notice/{board_no}/update")
    public ModelAndView noticeBoardUpdateForm(@ModelAttribute BaseParameter params, @PathVariable String board_no) {
        ModelAndView VIEW = new ModelAndView("pages/board/notice-board-update-form");
        VIEW.addObject("menuCd", params.getMenuCd());
        VIEW.addObject("breadcrumb", getBreadcrumb(params.getMenuCd()));
        VIEW.addObject("pageParams", getBaseParameterString(params));
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        log.info("noticeBoardUpdateForm -> {}, {}", paramsMap, board_no);
        Map<String, Object> board = boardService.getBoardBySeq(board_no);
        Files files = filesService.getBoardFile(Integer.parseInt(board.get("board_seq").toString()));
        board.put("files", files);
        log.info("board -> {}", board);
        VIEW.addObject("board", board);
        return VIEW;
    }

    @GetMapping("/community/{board_no}/update")
    public ModelAndView communityBoardUpdateForm(@ModelAttribute BaseParameter params, @PathVariable String board_no) {
        ModelAndView VIEW = new ModelAndView("pages/board/community-board-update-form");
        VIEW.addObject("menuCd", params.getMenuCd());
        VIEW.addObject("breadcrumb", getBreadcrumb(params.getMenuCd()));
        VIEW.addObject("pageParams", getBaseParameterString(params));
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        log.info("communityBoardUpdateForm -> {}, {}", paramsMap, board_no);
        Map<String, Object> board = boardService.getBoardBySeq(board_no);
        Files files = filesService.getBoardFile(Integer.parseInt(board.get("board_seq").toString()));
        board.put("files", files);
        log.info("board -> {}", board);
        VIEW.addObject("board", board);
        return VIEW;
    }

    @PostMapping(value = "/{type}/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public Map<String, Object> boardRegister(HttpServletRequest request,
                                             @RequestParam("title") String title,
                                             @RequestParam("description") String description,
                                             @RequestParam("rlsYn") String rlsYn,
                                             @Nullable @RequestParam("file") MultipartFile file,
                                             @PathVariable String type) {
        Map<String, Object> result = new HashMap<>();
        //게시물 기본 정보 등록
        Board board = new Board();
        board.setBoardNm(title);
        board.setBoardDerpn(description);
        board.setBoardSmpDerpn(description.replaceAll("\n", "").length() > 200 ? description.replaceAll("\n", "").substring(0, 200) : description.replaceAll("\n", ""));
        board.setRlsYn(rlsYn);
        switch (type) {
            case "notice": {
                board.setBoardTp("N");
                break;
            }
            case "community": {
                board.setBoardTp("C");
                break;
            }
            default: {
                result.put("code", GlobalConstant.API_STATUS.FAIL);
                return result;
            }
        }
        board.setUseYn("Y");
        board.setDelYn("N");
        board.setRegIp(getClientIP(request));
        board.setRegUserSeq(getSessionLoginUserSeq(request));

        int boardSeq = boardService.saveBoard(board);

        //파일 등록
        try {
            if (file != null) {
                int filesNo = filesService.saveBoardFiles(file, null, GlobalConstant.FILE_REF_TYPE.ORIGIN, board.getBoardSeq(), board.getRegUserSeq(), board.getRegIp(), board.getBoardTp());
                log.info("filesNo -> {}", filesNo);
            }
        } catch (IOException e) {
            e.printStackTrace();
            result.put("code", GlobalConstant.API_STATUS.FAIL);
            return result;
        }
        log.info("boardRegister -> {}", board);
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping(value = "/{type}/{board_no}/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public Map<String, Object> boardUpdate(HttpServletRequest request,
                                           @RequestParam("title") String title,
                                           @RequestParam("description") String description,
                                           @RequestParam("rlsYn") String rlsYn,
                                           @Nullable @RequestParam("originFileNm") String originFileNm,
                                           @Nullable @RequestParam("originFileCheck") String originFileCheck,
                                           @Nullable @RequestParam("file") MultipartFile file,
                                           @PathVariable String type, @PathVariable String board_no) {
        Map<String, Object> result = new HashMap<>();
        log.info("boardUpdate -> {}, {}, {}, {}, {}, {}", title, description, rlsYn, file, type, board_no);
        //게시물 기본 정보 등록
        Board board = new Board();
        board.setBoardSeq(Integer.parseInt(board_no));
        board.setBoardNm(title);
        board.setBoardDerpn(description);
        board.setBoardSmpDerpn(description.replaceAll("\n", "").length() > 200 ? description.replaceAll("\n", "").substring(0, 200) : description.replaceAll("\n", ""));
        board.setRlsYn(rlsYn);
        switch (type) {
            case "notice": {
                board.setBoardTp("N");
                break;
            }
            case "community": {
                board.setBoardTp("C");
                break;
            }
            default: {
                result.put("code", GlobalConstant.API_STATUS.FAIL);
                return result;
            }
        }
        board.setUseYn("Y");
        board.setDelYn("N");
        board.setMdfcnIp(getClientIP(request));
        board.setMdfcnUserSeq(getSessionLoginUserSeq(request));
        boardService.updateBoard(board);

        log.info("boardUpdate -> {}", board);

        log.info("originFileCheck -> {}", originFileCheck);
        log.info("originFileNm -> {}", originFileNm);

        //파일 등록
        try {
            Files files = filesService.getBoardFile(board.getBoardSeq());
            if ((files != null && file != null && file.getSize() > 0) || (originFileCheck != null && originFileCheck.equals("true") && originFileNm == null)) {
                files.setDelIp(board.getMdfcnIp());
                files.setDelYn("Y");
                files.setDelUserSeq(board.getMdfcnUserSeq());
                filesService.deleteBoardFile(files);
            }
            if (file != null) {
                int filesNo = filesService.saveBoardFiles(file, null, GlobalConstant.FILE_REF_TYPE.ORIGIN, board.getBoardSeq(), board.getMdfcnUserSeq(), board.getMdfcnIp(), board.getBoardTp());
                log.info("filesNo -> {}", filesNo);
            }
        } catch (IOException e) {
            e.printStackTrace();
            result.put("code", GlobalConstant.API_STATUS.FAIL);
            return result;
        }
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping(value = "/{type}/{board_no}/delete")
    @ResponseBody
    public Map<String, Object> boardDelete(HttpServletRequest request, @PathVariable String type, @PathVariable String board_no) {
        Map<String, Object> result = new HashMap<>();
        log.info("boardDelete -> {}, {}", type, board_no);
        Board board = new Board();
        switch (type) {
            case "notice": {
                board.setBoardTp("N");
                break;
            }
            case "community": {
                board.setBoardTp("C");
                break;
            }
            default: {
                result.put("code", GlobalConstant.API_STATUS.FAIL);
                return result;
            }
        }
        board.setBoardSeq(Integer.parseInt(board_no));
        board.setDelYn("Y");
        board.setDelIp(getClientIP(request));
        board.setDelUserSeq(getSessionLoginUserSeq(request));
        log.info("board -> {}", board);
        boardService.deleteBoardByBoardSeqAndType(board);
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }
}
