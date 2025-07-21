package com.stoneitgt.dt.data.platform.admin.service;

import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.mapper.FilesMapper;
import com.stoneitgt.dt.data.platform.domain.Files;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class FilesService extends BaseService {

    @Autowired
    private FilesMapper filesMapper;

    public List<Map<String, Object>> getDtMetaFileList(String refType, int refSrno) {
        return filesMapper.getDtMetaFileList(refType, refSrno);
    }

    public Files getDtFile(int fileSeq) {
        return filesMapper.getDtFile(fileSeq);
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    public int saveBoardFiles(MultipartFile attachFile, String fileTitle, String directory, int refSeq, int loginUserSeq, String loginUserIp, String refTp)
            throws IOException {

        long fileSize = attachFile.getSize();

        if (fileSize > 0) {
            Files files = new Files();
            files.setFileNm(attachFile.getOriginalFilename());
            files.setFileSz(fileSize);
            //files.setFileByte(FileUtil.sizeOfAsString(fileSize));
            files.setRefTp(refTp);
            files.setFileTp(FILE_REF_TYPE.ORIGIN.toUpperCase());
            files.setRefSeq(refSeq);
            files.setFileExtn(FileUtil.getFileExtension(files.getFileNm()));
            files.setFileTitle(fileTitle);
            files.setLoginUserSeq(loginUserSeq);
            files.setLoginUserIp(loginUserIp);

            log.info("files -> {}", files);

            filesMapper.insertBoardFile(files);

            String filePath = FileUtil.getUploadFilePath(directory);
            log.info("filePath -> {}", filePath);
            files.setFilePath(filePath);
            files.setStrgFileNm(files.getFileSeq() + "." + FilenameUtils.getExtension(attachFile.getOriginalFilename()));

            log.info("inserted and update files -> {}", files);
            log.info("systemProperties.getUploadFilePath() + files.getFilePath() -> {}", systemProperties.getUploadFilePath() + files.getFilePath());
            FileUtil.uploadFile(systemProperties.getUploadFilePath() + files.getFilePath(), files.getStrgFileNm(), attachFile);
            Path saveLastFile = Paths.get(systemProperties.getUploadFilePath() + files.getFilePath() + files.getStrgFileNm());
            files.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
            filesMapper.updateBoardFile(files);

            return files.getFileSeq();
        } else {
            return 0;
        }
    }

    public Map<String, Object> saveNewDtFiles(MultipartFile attachFile, String directory)
            throws IOException {

        Map<String, Object> result = new HashMap<String, Object>();
        long fileSize = attachFile.getSize();

        if (fileSize > 0) {
            Files files = new Files();
            files.setFileNm(attachFile.getOriginalFilename());

            String filePath = systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + directory + "/";
            files.setFilePath(filePath);

            FileUtil.uploadFile(filePath, files.getFileNm(), attachFile);
            result.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + directory);
            result.put("file_name", attachFile.getOriginalFilename());
        }

        return result;
    }

    public int savePreProcLastFiles(String sourceDirectory, String baseDir, String fileName, int refSeq, String jobLevel, int loginUserSeq, String loginUserIp)
            throws IOException {
        String addDirectory = FileUtil.getUploadDtFilePath(FILE_REF_TYPE.DATA, refSeq);
        String moveDirectory = systemProperties.getDtMetaFilePath() + addDirectory;

        File sourcePath = new File(sourceDirectory);
        File movePath = new File(moveDirectory);

        // 디렉토리 이동
        FileUtils.copyDirectory(sourcePath, movePath);

        File file = new File(moveDirectory + File.separator + fileName);

        Files files = new Files();
        files.setFileNm(file.getName());
        files.setStrgFileNm(file.getName());
        files.setFilePath(addDirectory);
        files.setFileSz(file.length());
        files.setFileExtn(FileUtil.getFileExtension(file.getName()));
        files.setRefTp(FILE_REF_TYPE.DATA.toUpperCase());
        files.setPprcsTp(jobLevel);
        files.setRefSeq(refSeq);
        files.setLoginUserSeq(loginUserSeq);
        files.setLoginUserIp(loginUserIp);

        Path saveLastFile = Paths.get(moveDirectory + File.separator + fileName);
        files.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
        filesMapper.insertMetaDtFile(files);

        return files.getFileSeq();
    }

    public Map<String, Object> saveNewEtcDtFiles(MultipartFile attachFile, String directory)
            throws IOException {

        Map<String, Object> result = new HashMap<String, Object>();
        long fileSize = attachFile.getSize();

        if (fileSize > 0) {
            Files files = new Files();
            files.setFileNm(attachFile.getOriginalFilename());

            String filePath = systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + directory + "/";
            files.setFilePath(filePath);

            FileUtil.uploadFile(filePath, files.getFileNm(), attachFile);
            result.put("file_path", systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + directory);
            result.put("file_name", attachFile.getOriginalFilename());
        }

        return result;
    }

    public int saveEtcModelLastFiles(String sourceDirectory, String baseDir, String fileName, int refSeq, int loginUserSeq, String loginUserIp)
            throws IOException {
        String addDirectory = FileUtil.getUploadDtFilePath(FILE_REF_TYPE.DATA, refSeq);
        String moveDirectory = systemProperties.getDtEtcMetaFilePath() + addDirectory;

        File sourcePath = new File(sourceDirectory);
        File movePath = new File(moveDirectory);

        // 디렉토리 이동
        FileUtils.copyDirectory(sourcePath, movePath);

        File file = new File(moveDirectory + File.separator + fileName);

        Files files = new Files();
        files.setFileNm(file.getName());
        files.setStrgFileNm(file.getName());
        files.setFilePath(addDirectory);
        files.setFileSz(file.length());
        files.setFileExtn(FileUtil.getFileExtension(file.getName()));
        files.setRefTp(FILE_REF_TYPE.DATA.toUpperCase());
        files.setRefSeq(refSeq);
        files.setLoginUserSeq(loginUserSeq);
        files.setLoginUserIp(loginUserIp);

        Path saveLastFile = Paths.get(moveDirectory + File.separator + fileName);

        log.info("moveDirectory + File.separator + fileName::::::::::::::");
        log.info(moveDirectory);
        log.info(fileName);


        files.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
        filesMapper.insertEtcMetaDtFile(files);
        return files.getFileSeq();
    }

    public int saveAugmentFiles(String sourceDirectory, String baseDir, String fileName, int refSeq)
            throws IOException {
        File sourcePath = new File(sourceDirectory);

        // 디렉토리 이동
        File file = new File(sourceDirectory + File.separator + fileName);

        Files files = new Files();
        files.setFileNm(file.getName());
        files.setStrgFileNm(file.getName());
        files.setFilePath(baseDir);
        files.setFileSz(file.length());
        files.setFileExtn(FileUtil.getFileExtension(file.getName()));
        files.setRefTp(FILE_REF_TYPE.CYCLE.toUpperCase());
        files.setRefSeq(refSeq);

        Path saveLastFile = Paths.get(sourceDirectory + File.separator + fileName);
        files.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
        filesMapper.insertMetaAugmentFile(files);

        return files.getFileSeq();
    }

    public Files getDtMetaAugmentFile(int fileSeq) {
        return filesMapper.getDtMetaAugmentFile(fileSeq);
    }

    public Files getBoardFile(int boardSeq) {
        Files files = filesMapper.getBoardFile(boardSeq);
        if (files != null) {
            files.setChangedFileSize(FileUtil.formatFileSize(files.getFileSz()));
        }
        return files;
    }

    public void deleteBoardFile(Files files) {
        filesMapper.deleteBoardFiles(files);
    }

    public Files getDtEtcFile(int fileSeq) {
        return filesMapper.getDtEtcFile(fileSeq);
    }
}
