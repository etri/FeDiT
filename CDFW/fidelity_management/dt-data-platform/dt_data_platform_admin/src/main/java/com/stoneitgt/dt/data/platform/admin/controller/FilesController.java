package com.stoneitgt.dt.data.platform.admin.controller;

import com.stoneitgt.dt.data.platform.admin.service.FilesService;
import com.stoneitgt.dt.data.platform.domain.DataFileDownloadLog;
import com.stoneitgt.dt.data.platform.domain.Files;
import com.stoneitgt.dt.data.platform.domain.User;
import com.stoneitgt.dt.data.platform.util.StringUtil;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;

@Slf4j
@Controller
@RequestMapping("/file")
public class FilesController extends BaseController {

    @Autowired
    private FilesService filesService;

    @GetMapping("/download/dt/{fileSeq}")
    public void dtDownloadFile(@PathVariable int fileSeq, HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        log.info("fileSeq -> {}", fileSeq);
        Files files = filesService.getDtFile(fileSeq);

        log.info("files -> {}", files);

        if (files == null) {
            return;
        }

        File file = new File(systemProperties.getDtMetaFilePath() + files.getFilePath() + files.getFileNm());

        if (StringUtil.isNoneBlank(files.getFileContsTp())) {
            response.setContentType(files.getFileContsTp());
        }

        User user = authenticationFacade.getLoginUser();

        DataFileDownloadLog dataFileDownloadLog = new DataFileDownloadLog();
        dataFileDownloadLog.setFileSeq(files.getFileSeq());
        dataFileDownloadLog.setModelSeq(files.getModelSeq());
        dataFileDownloadLog.setRegUserSeq(user.getUserSeq());
        dataFileDownloadLog.setRegIp(authenticationFacade.getLoginUserIp());
        logService.insertDtDataFileLog(dataFileDownloadLog);

        FileUtil.outputStreamFile(file, files.getFileNm(), response, request);
    }

    @GetMapping("/download/dt/etc/{fileSeq}")
    public void dtEtcDownloadFile(@PathVariable int fileSeq, HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        Files files = filesService.getDtEtcFile(fileSeq);

        if (files == null) {
            return;
        }

        File file = new File(systemProperties.getDtEtcMetaFilePath() + files.getFilePath() + files.getFileNm());

        if (StringUtil.isNoneBlank(files.getFileContsTp())) {
            response.setContentType(files.getFileContsTp());
        }

        User user = authenticationFacade.getLoginUser();

        DataFileDownloadLog dataFileDownloadLog = new DataFileDownloadLog();
        dataFileDownloadLog.setFileSeq(files.getFileSeq());
        dataFileDownloadLog.setModelSeq(files.getEtcModelSeq());
        dataFileDownloadLog.setRegUserSeq(user.getUserSeq());
        dataFileDownloadLog.setRegIp(authenticationFacade.getLoginUserIp());
        logService.insertDtEtcDataFileLog(dataFileDownloadLog);

        FileUtil.outputStreamFile(file, files.getFileNm(), response, request);
    }

    @GetMapping("/download/dt/meta/augment/{fileSeq}")
    public void dtDownloadMetaAugmentFile(@PathVariable int fileSeq, HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        Files files = filesService.getDtMetaAugmentFile(fileSeq);

        if (files == null) {
            return;
        }

        File file = new File(systemProperties.getDtMetaFilePath() + files.getFilePath() + "/" + files.getFileNm());

        if (StringUtil.isNoneBlank(files.getFileContsTp())) {
            response.setContentType(files.getFileContsTp());
        }

        FileUtil.outputStreamFile(file, files.getFileNm(), response, request);
    }

    @GetMapping("/download/board/{boardSeq}")
    public void dtDownloadBoardFile(@PathVariable int boardSeq, HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        log.info("dtDownloadBoardFile -> {}", boardSeq);
        Files files = filesService.getBoardFile(boardSeq);
        if (files == null) {
            return;
        }
        log.info("files -> {}", files);
        log.info("systemProperties.getUploadFilePath() -> {}", systemProperties.getUploadFilePath());
        log.info("files.getFilePath() -> {}", files.getFilePath());
        log.info("files.getFileNm() -> {}", files.getFileNm());
        File file = new File(systemProperties.getUploadFilePath() + files.getFilePath() + File.separator + files.getStrgFileNm());
        if (StringUtil.isNoneBlank(files.getFileContsTp())) {
            response.setContentType(files.getFileContsTp());
        }
        FileUtil.outputStreamFile(file, files.getFileNm(), response, request);
    }
}
