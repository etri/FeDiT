package kr.co.e8ight.ndxpro.translatorManager.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.config.Constants;
import kr.co.e8ight.ndxpro.translatorManager.exception.LogException;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

@Service
@Slf4j
public class FileService {

    @Value("${translator.dir}")
    private String translatorDir;

    public String readFile(String filePath) {
        Path path = Paths.get(filePath);
        // 파일은 UTF-8 바이트로 쓰여 있으나 실행 환경의 기본 charset 에 좌우되지 않도록
        // ISO-8859-1(바이트 1:1 매핑)로 읽은 뒤 UTF-8 로 다시 해석한다.
        try (BufferedReader bufferedReader = new BufferedReader(
                new InputStreamReader(Files.newInputStream(path), StandardCharsets.ISO_8859_1))) {
            String line;
            StringBuilder jsonStringBuilder = new StringBuilder();

            while ((line = bufferedReader.readLine()) != null) {
                jsonStringBuilder.append(fromIso8859_1ToUtf8(line));
            }
            return jsonStringBuilder.toString();
        } catch (NoSuchFileException e) {
            log.error("Output file not found. path={}", filePath, e);
            throw new LogException(ErrorCode.RESOURCE_NOT_FOUND,
                    "Output file : " + filePath + " not found.");
        } catch (IOException e) {
            log.error("Output file read error. path={}", filePath, e);
            throw new LogException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Output file : " + filePath + " read error occur.");
        }
    }

    private static String fromIso8859_1ToUtf8(String line) {
        return new String(line.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
    }

    public void saveJarFileOnTranslatorDir(String fileName, byte[] bytes) {
        writeJarFile(fileName, bytes);
    }

    public void replaceJarFileOnTranslatorDir(String fileName, byte[] bytes) {
        writeJarFile(fileName, bytes);
    }

    /**
     * jar 를 통째로 새로 쓴다.
     *
     * TRUNCATE_EXISTING 이 빠지면 기존 파일보다 짧은 내용을 쓸 때 앞부분만 덮이고 뒤쪽 바이트가
     * 남아 깨진 jar 가 만들어진다. CREATE_NEW 를 쓰면 이미 있는 파일에는 아예 쓰지 못한다.
     */
    private void writeJarFile(String fileName, byte[] bytes) {
        Path path = jarPath(fileName);
        try {
            createTranslatorDirIfAbsent(path);
            Files.write(path, bytes,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING,
                    StandardOpenOption.WRITE);
        } catch (IOException e) {
            log.error("Failed to write translator jar. path={}", path, e);
            throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Translator jar write failed. path : " + path + " | " + e.getMessage());
        }
    }

    /**
     * jar 가 이미 없으면 성공으로 본다. 삭제 자체가 실패해도 상위 작업을 막지 않는다.
     */
    public void deleteJarFileOnTranslatorDir(String fileName) {
        Path path = jarPath(fileName);
        try {
            boolean deleted = Files.deleteIfExists(path);
            log.info("translator jar delete. path={} deleted={}", path, deleted);
        } catch (IOException e) {
            log.error("Failed to delete translator jar. path={}", path, e);
        }
    }

    private Path jarPath(String fileName) {
        return Paths.get(translatorDir, fileName + Constants.JAR_FILE_EXTENSION);
    }

    private void createTranslatorDirIfAbsent(Path jarPath) throws IOException {
        Path parent = jarPath.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
    }
}
