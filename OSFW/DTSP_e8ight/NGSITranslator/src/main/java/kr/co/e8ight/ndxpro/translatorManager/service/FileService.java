package kr.co.e8ight.ndxpro.translatorManager.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.config.Constants;
import kr.co.e8ight.ndxpro.translatorManager.exception.LogException;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;

@Service
@Slf4j
public class FileService {

    @Value("${translator.dir}")
    private String translatorDir;

    public String readFile(String filePath) {
        File file = new File(filePath);
        try (BufferedReader bufferedReader = new BufferedReader(new FileReader(file))) {
            String line;
            StringBuilder jsonStringBuilder = new StringBuilder();

            while ((line = bufferedReader.readLine()) != null) {
                String utf8Line = fromIso8859_1ToUtf8(line);
                jsonStringBuilder.append(utf8Line);
            }
            return jsonStringBuilder.toString();
        } catch (FileNotFoundException e) {
            log.error("Exception : " + ExceptionUtils.getStackTrace(e));
            throw new LogException(ErrorCode.RESOURCE_NOT_FOUND,
                    "Output file : " + filePath + " not found.");
        } catch (IOException e) {
            log.error("Exception : " + ExceptionUtils.getStackTrace(e));
            throw new LogException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Output file : " + filePath + " read error occur.");
        }
    }

    private static String fromIso8859_1ToUtf8(String line) {
        return new String(line.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
    }

    public void saveJarFileOnTranslatorDir(String fileName, byte[] bytes) {
        try {
            Path path = Paths.get(translatorDir + "/" + fileName + Constants.JAR_FILE_EXTENSION);
            Files.write(path, bytes, StandardOpenOption.CREATE);
        } catch (IOException e) {
            throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    public void replaceJarFileOnTranslatorDir(String fileName, byte[] bytes) {
        try {
            Path path = Paths.get(translatorDir + "/" + fileName + Constants.JAR_FILE_EXTENSION);
            Files.write(path, bytes, StandardOpenOption.CREATE_NEW);
        } catch (IOException e) {
            throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    public void deleteJarFileOnTranslatorDir(String fileName) {
        try {
            Path path = Paths.get(translatorDir + "/" + fileName + Constants.JAR_FILE_EXTENSION);
            Files.delete(path);
        } catch (IOException e) {
            throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}
