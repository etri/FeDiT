package kr.co.e8ight.ndxpro.fileservice.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Path;

@Service
@Slf4j
public class FileIoService {

    public byte[] getByteArrayFromFilePath(String path) {
        try (FileInputStream fileInputStream = new FileInputStream(path)) {
            return fileInputStream.readAllBytes();
        } catch (IOException e) {
            throw new FileException(ErrorCode.INTERNAL_SERVER_ERROR, "read file error. " + e.getMessage());
        }
    }

    public void writeFile(String path, MultipartFile multipartFile) throws IOException {
        File file = new File(path);
        log.info("start write physical file : {}", file.getAbsolutePath());
        file.getParentFile().mkdirs();
        multipartFile.transferTo(Path.of(file.getAbsolutePath()));
    }
}
