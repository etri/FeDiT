package kr.co.e8ight.ndxpro.translatorManager.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.config.Constants;
import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorCheckResponseDto;
import kr.co.e8ight.ndxpro.translatorManager.dto.LogResponseDto;
import kr.co.e8ight.ndxpro.translatorManager.exception.LogException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

@Service
@Slf4j
public class TranslatorLogService {

    @Value("${logging.file.path}")
    private String translatorLogPath;

    public String getTranslatorLogPath() {
        return translatorLogPath;
    }

    public LogResponseDto getLogById(Long translatorId, Long startLineNum) {

        StringBuilder logStringBuilder = new StringBuilder();
        File file = new File(getTranslatorLogFilePath(translatorId));

        long count;

        try (Stream<String> lines = Files.lines(Path.of(getTranslatorLogFilePath(translatorId)))) {
            count = lines.count();
        } catch (FileNotFoundException e) {
            log.error("Exception : " + ExceptionUtils.getStackTrace(e));
            throw new LogException(ErrorCode.RESOURCE_NOT_FOUND,
                    "Log file : " + getTranslatorLogFilePath(translatorId) + " not found.");
        } catch (IOException e) {
            log.error("Exception : " + ExceptionUtils.getStackTrace(e));
            throw new LogException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Log file : " + getTranslatorLogFilePath(translatorId) + " read error occur.");
        }

        long preEndPoint = startLineNum == null ? count - 100 : startLineNum;

        try (BufferedReader bufferedReader = new BufferedReader(new FileReader(file))) {

            String line;
            long endLineNum = 0;
            while ((line = bufferedReader.readLine()) != null) {
                if ( endLineNum >= preEndPoint ) {
                    String utf8Line = fromIso8859_1ToUtf8(line);
                    logStringBuilder.append(utf8Line);
                    logStringBuilder.append("\n");
                }
                endLineNum++;
            }
            endLineNum--;

            return new LogResponseDto(logStringBuilder.toString(), endLineNum);
        } catch (FileNotFoundException e) {
            log.error("Exception : " + ExceptionUtils.getStackTrace(e));
            throw new LogException(ErrorCode.RESOURCE_NOT_FOUND,
                    "Log file : " + getTranslatorLogFilePath(translatorId) + " not found.");
        } catch (IOException e) {
            log.error("Exception : " + ExceptionUtils.getStackTrace(e));
            throw new LogException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Log file : " + getTranslatorLogFilePath(translatorId) + " read error occur.");
        }
    }

    private static String fromIso8859_1ToUtf8(String line) {
        return new String(line.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
    }

    private String getTranslatorLogFilePath(Long agentId) {
        return translatorLogPath + "/translator_" + agentId + Constants.LOG_FILE_EXTENSION;
    }
}
