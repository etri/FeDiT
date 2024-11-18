package kr.co.e8ight.ndxpro.translatorManager.domain;

import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorCheckRequestDto;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public abstract class Operater {

    protected static final Logger log = LoggerFactory.getLogger(Operater.class);
    protected String command;

    public abstract Translator operate(Translator translator, TranslatorCheckRequestDto requestDto);

    public abstract Translator operate(Translator translator);

    protected Process exec(String[] command) {
        try {
            ProcessBuilder builder = new ProcessBuilder(command);
            Process start = builder.start();
            return start;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    protected String inputStreamToString(InputStream inputStream) throws IOException {
        return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    }

    protected void killTranslator(Translator translator) {
        try {
            killProcess(translator.getPid());
        } catch (Exception e) {
            log.error("Exception : "+ ExceptionUtils.getStackTrace(e));
        }
    }

    private void killProcess(int pid) throws IOException {
        String[] commands = {"kill", pid+""};
        log.info("kill: {}", Arrays.toString(commands));

        ProcessBuilder builder = new ProcessBuilder(commands);
        builder.start();
    }
}
