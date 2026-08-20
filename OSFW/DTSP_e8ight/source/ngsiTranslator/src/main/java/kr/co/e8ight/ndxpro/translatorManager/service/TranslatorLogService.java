package kr.co.e8ight.ndxpro.translatorManager.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.config.Constants;
import kr.co.e8ight.ndxpro.translatorManager.dto.LogResponseDto;
import kr.co.e8ight.ndxpro.translatorManager.exception.LogException;
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

@Service
@Slf4j
public class TranslatorLogService {

    private static final long DEFAULT_TAIL_LINES = 100;

    @Value("${logging.file.path}")
    private String translatorLogPath;

    public String getTranslatorLogPath() {
        return translatorLogPath;
    }

    public LogResponseDto getLogById(Long translatorId, Long startLineNum) {
        Path path = getTranslatorLogFilePath(translatorId);

        long count = countLines(path);
        long preEndPoint = startLineNum == null ? count - DEFAULT_TAIL_LINES : startLineNum;

        StringBuilder logStringBuilder = new StringBuilder();
        try (BufferedReader bufferedReader = newReader(path)) {
            String line;
            long endLineNum = 0;
            while ((line = bufferedReader.readLine()) != null) {
                if ( endLineNum >= preEndPoint ) {
                    logStringBuilder.append(fromIso8859_1ToUtf8(line));
                    logStringBuilder.append("\n");
                }
                endLineNum++;
            }
            endLineNum--;

            return new LogResponseDto(logStringBuilder.toString(), endLineNum);
        } catch (NoSuchFileException e) {
            throw notFound(path, e);
        } catch (IOException e) {
            throw readError(path, e);
        }
    }

    private long countLines(Path path) {
        try (BufferedReader bufferedReader = newReader(path)) {
            long count = 0;
            while (bufferedReader.readLine() != null) {
                count++;
            }
            return count;
        } catch (NoSuchFileException e) {
            throw notFound(path, e);
        } catch (IOException e) {
            throw readError(path, e);
        }
    }

    /**
     * 로그는 UTF-8 바이트로 쓰이지만 실행 환경의 기본 charset 이 무엇이든 같은 결과를 내야 하므로
     * ISO-8859-1(바이트 1:1 매핑)로 읽은 뒤 {@link #fromIso8859_1ToUtf8} 로 되돌린다.
     * Files.lines() 는 UTF-8 로 강제 해석해 깨진 바이트에서 UncheckedIOException 을 던지므로 쓰지 않는다.
     */
    private BufferedReader newReader(Path path) throws IOException {
        return new BufferedReader(new InputStreamReader(Files.newInputStream(path), StandardCharsets.ISO_8859_1));
    }

    private LogException notFound(Path path, IOException e) {
        log.error("Log file not found. path={}", path, e);
        return new LogException(ErrorCode.RESOURCE_NOT_FOUND, "Log file : " + path + " not found.");
    }

    private LogException readError(Path path, IOException e) {
        log.error("Log file read error. path={}", path, e);
        return new LogException(ErrorCode.INTERNAL_SERVER_ERROR, "Log file : " + path + " read error occur.");
    }

    private static String fromIso8859_1ToUtf8(String line) {
        return new String(line.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
    }

    private Path getTranslatorLogFilePath(Long translatorId) {
        return Path.of(translatorLogPath, "translator_" + translatorId + Constants.LOG_FILE_EXTENSION);
    }
}
