package com.stoneitgt.dt.data.platform.admin.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.admin.mapper.FilesMapper;
import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.domain.Files;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;

import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;

@Slf4j
@Service
public class FilesService {

    @Autowired
    private SystemProperties systemProperties;

    @Autowired
    private FilesMapper filesMapper;

    public List<Map<String, Object>> getDtFileList(Map<String, Object> params) {
        return filesMapper.getDtFileList(params);
    }

    public List<Map<String, Object>> getDtMetaFileList(Map<String, Object> params) {
        return filesMapper.getDtMetaFileList(params);
    }

    public Files getFile(int fileSeq) {
        return filesMapper.getFile(fileSeq);
    }

    public Files getDtFile(int fileSeq) {
        return filesMapper.getDtFile(fileSeq);
    }

    public int deleteFile(Files files) {
        return filesMapper.deleteFile(files);
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
            FileUtil.uploadFile2(systemProperties.getUploadFilePath() + files.getFilePath(), files.getStrgFileNm(), attachFile);
            Path saveLastFile = Paths.get(systemProperties.getUploadFilePath() + files.getFilePath() + files.getStrgFileNm());
            files.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
            filesMapper.updateBoardFile(files);

            return files.getFileSeq();
        } else {
            return 0;
        }
    }

    public int saveDtFiles(MultipartFile attachFile, String directory, int refSeq, int loginUserSeq, int modelSeq, String loginUserIp) throws IOException {
        return saveDtFiles(attachFile, null, directory, refSeq, loginUserSeq, modelSeq, loginUserIp);
    }

    public int saveDtFiles(MultipartFile attachFile, String fileTitle, String directory, int refSeq, int loginUserSeq, int modelSeq, String loginUserIp)
            throws IOException {

        long fileSize = attachFile.getSize();

        if (fileSize > 0) {
            Files files = new Files();
            files.setFileNm(attachFile.getOriginalFilename());
            files.setStrgFileNm(attachFile.getOriginalFilename());
            files.setFileSz(fileSize);
            //files.setFileByte(FileUtil.sizeOfAsString(fileSize));
            files.setRefTp(FILE_REF_TYPE.ORIGIN.toUpperCase());
            files.setRefSeq(refSeq);
            files.setFileExtn(FileUtil.getFileExtension(files.getFileNm()));
            files.setFileTitle(fileTitle);
            files.setLoginUserSeq(loginUserSeq);
            //files.setLoginUserId(loginUserId);
            files.setModelSeq(modelSeq);
            files.setLoginUserIp(loginUserIp);

            //log.info("attachFile.getOriginalFilename()::" + attachFile.getOriginalFilename());
            filesMapper.insertDtFile(files);
            String filePath = FileUtil.getUploadDtFilePath(directory, files.getModelSeq());
            //files.setFilePath(filePath + files.getFileSeq());
            files.setFilePath(filePath);

            //files.setStrgFileNm(files.getFileSeq() +  "." + FilenameUtils.getExtension(attachFile.getOriginalFilename()));
            files.setFileNm(files.getFileSeq() + "_" + attachFile.getOriginalFilename());

            FileUtil.uploadFile2(systemProperties.getDtFilePath() + files.getFilePath(), files.getFileNm(), attachFile);
            //File file = FileUtil.uploadFile2(systemProperties.getUploadFilePath() + files.getFilePath(), files.getStrgFileNm(), attachFile);
            //files.setFileContentType(FileUtil.getFileContentType(file));

            filesMapper.updateDtFile(files);

            return files.getFileSeq();
        }

        return 0;
    }

    public int saveDtAugmentFiles(String fileFullPath, String dir, String prcsLevel, int refSeq, int loginUserSeq, String loginUserIp)
            throws IOException {
        File file = new File(fileFullPath);

        Files files = new Files();
        files.setFileNm(file.getName());
        files.setStrgFileNm(file.getName());
        files.setFilePath(dir);
        files.setFileSz(file.length());
        files.setFileExtn(FileUtil.getFileExtension(file.getName()));
        files.setRefTp(FILE_REF_TYPE.AUGMENT.toUpperCase());
        files.setPprcsTp(prcsLevel);
        files.setRefSeq(refSeq);
        files.setLoginUserSeq(loginUserSeq);
        files.setLoginUserIp(loginUserIp);

        Path savePath = Paths.get(fileFullPath);
        //files.setFileContsTp(new MimetypesFileTypeMap().getContentType(file));
        files.setFileContsTp(java.nio.file.Files.probeContentType(savePath));

        filesMapper.insertDtAugmentFile(files);

        files.setFileNm(files.getFileSeq() + "_" + file.getName());
        filesMapper.updateDtAugmentFile(files);

        return files.getFileSeq();
    }

    public Files getDtAugmentFile(int fileSeq) {
        return filesMapper.getDtAugmentFile(fileSeq);
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

            FileUtil.uploadFile2(filePath, files.getFileNm(), attachFile);
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

            FileUtil.uploadFile2(filePath, files.getFileNm(), attachFile);
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
        return filesMapper.getBoardFile(boardSeq);
    }

    public void deleteBoardFile(Files files) {
        filesMapper.deleteBoardFiles(files);
    }
}
