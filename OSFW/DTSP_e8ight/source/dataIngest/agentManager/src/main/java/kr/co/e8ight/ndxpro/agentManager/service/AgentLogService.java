package kr.co.e8ight.ndxpro.agentManager.service;

import kr.co.e8ight.ndxpro.agentManager.config.Constants;
import kr.co.e8ight.ndxpro.agentManager.config.TrackExecutionTime;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.LogResponseDto;
import kr.co.e8ight.ndxpro.agentManager.exceptions.LogException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

@Service
public class AgentLogService {

    @Value("${flume.log-dir}")
    private String flumeLogPath;

    private static final Logger log = LoggerFactory.getLogger(AgentLogService.class);

    @TrackExecutionTime
    public LogResponseDto getLogByAgentId(Long agentId, Long startLineNum) {

        StringBuilder logStringBuilder = new StringBuilder();
        File file = new File(getAgentLogFilePath(agentId));
        long count;

        if ( file.exists() ) {
            try (Stream<String> lines = Files.lines(Path.of(getAgentLogFilePath(agentId)))) {
                count = lines.count();
            } catch (IOException e) {
                log.error("Exception : " + ExceptionUtils.getStackTrace(e));
                throw new LogException(ErrorCode.INTERNAL_SERVER_ERROR,
                        "Log file : " + getAgentLogFilePath(agentId) + " read error occur.");
            }
        } else {
            throw new LogException(ErrorCode.RESOURCE_NOT_FOUND,
                    "Log file : " + getAgentLogFilePath(agentId) + " is not exists.");
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
                    "Log file : " + getAgentLogFilePath(agentId) + " not found.");
        } catch (IOException e) {
            log.error("Exception : " + ExceptionUtils.getStackTrace(e));
            throw new LogException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Log file : " + getAgentLogFilePath(agentId) + " read error occur.");
        }
    }

    private static String fromIso8859_1ToUtf8(String line) {
        return new String(line.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
    }

    private String getAgentLogFilePath(Long agentId) {
        return flumeLogPath + "/" + "agent_" + agentId + Constants.LOG_FILE_EXTENSION;
    }
}
