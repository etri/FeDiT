package kr.co.e8ight.ndxpro.translatorManager.domain;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.config.Constants;
import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorCheckRequestDto;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public abstract class Operater {

    protected static final Logger log = LoggerFactory.getLogger(Operater.class);

    public abstract Translator operate(Translator translator, TranslatorCheckRequestDto requestDto);

    public abstract Translator operate(Translator translator);

    /**
     * translator 프로세스를 띄운다.
     *
     * 표준출력/표준에러는 반드시 파일로 흘려보낸다. 리다이렉트를 걸지 않으면 자식의 출력이
     * 부모(매니저) 파이프에 쌓이는데, 이 파이프를 읽는 쪽이 없어 버퍼(약 64KB)가 차는 순간
     * 자식이 write 에서 영구히 멈춘다. 기존 명령의 nohup 은 표준출력이 터미널일 때만
     * nohup.out 으로 우회시키므로 ProcessBuilder 환경에서는 아무 역할도 하지 못했다.
     */
    protected Process exec(List<String> command, Path outputFile) {
        log.debug("exec: {}", command);
        try {
            ProcessBuilder builder = new ProcessBuilder(command);
            builder.redirectErrorStream(true);
            if (outputFile == null) {
                builder.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            } else {
                Path parent = outputFile.getParent();
                if (parent != null) {
                    Files.createDirectories(parent);
                }
                builder.redirectOutput(ProcessBuilder.Redirect.appendTo(outputFile.toFile()));
            }
            return builder.start();
        } catch (IOException e) {
            throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Failed to start translator process. command=" + command + " | " + e.getMessage());
        }
    }

    protected void killTranslator(Translator translator) {
        Integer pid = translator.getPid();
        if (pid == null) {
            log.warn("translator {} has no pid to kill.", translator.getId());
            return;
        }
        try {
            killProcess(pid);
        } catch (Exception e) {
            log.error("Failed to kill translator {} (pid : {}).", translator.getId(), pid, e);
        }
    }

    /**
     * 기존의 {@code kill <pid>} 외부 명령과 동일하게 SIGTERM 을 보낸다.
     * 프로세스가 이미 없으면 아무 것도 하지 않는다.
     */
    private void killProcess(int pid) {
        log.info("kill translator process. pid : {}", pid);
        ProcessHandle.of(pid).ifPresent(ProcessHandle::destroy);
    }

    /**
     * translator 프로세스의 표준출력을 모아 둘 파일. runner 가 직접 남기는
     * translator_{id}.log 와 겹치지 않도록 .out 을 쓴다.
     */
    protected Path processOutputFile(String logDir, Long translatorId) {
        return Path.of(logDir, "translator_" + translatorId + Constants.OUT_FILE_EXTENSION);
    }
}
