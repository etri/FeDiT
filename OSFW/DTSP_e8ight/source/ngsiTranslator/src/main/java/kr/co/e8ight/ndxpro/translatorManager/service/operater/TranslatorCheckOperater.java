package kr.co.e8ight.ndxpro.translatorManager.service.operater;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.domain.Translator;
import kr.co.e8ight.ndxpro.translatorManager.domain.Operater;
import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorCheckRequestDto;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class TranslatorCheckOperater extends Operater {

    @Value("${translator.dir}")
    private String translatorDir;

    @Value("${logging.file.path}")
    private String logDir;

    @Value("${translator.default.poll-duration}")
    private String pollDuration;

    /** 검증 프로세스를 기다릴 최대 시간. 트랜잭션이 무한정 잡히는 것을 막는다. */
    @Value("${translator.check.timeout-seconds:60}")
    private long checkTimeoutSeconds;

    @Override
    public Translator operate(Translator translator, TranslatorCheckRequestDto requestDto) {
        Process exec = exec(getCommands(translator, requestDto.getSampleJson()),
                processOutputFile(logDir, translator.getId()));
        try {
            if (!exec.waitFor(checkTimeoutSeconds, TimeUnit.SECONDS)) {
                exec.destroyForcibly();
                throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR,
                        "Translator check timed out after " + checkTimeoutSeconds + "s.");
            }
        } catch (InterruptedException e) {
            exec.destroyForcibly();
            Thread.currentThread().interrupt();
            throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }

        return translator;
    }

    @Override
    public Translator operate(Translator translator) {
        throw new TranslatorException(ErrorCode.OPERATION_NOT_SUPPORTED, "TranslatorCheckRequestDto is required.");
    }

    private List<String> getCommands(Translator translator, String sampleJson) {
        return List.of("java", "-jar",
                "-Dtranslator.mode=test",
                "-Dtranslator.context=" + translator.getContext(),
                "-Dtranslator.model=" + translator.getModelType(),
                "-Dtranslator.classname=kr.co.e8ight.ndxpro.translatorRunner.translator." + translator.getName(),
                "-Dtranslator.sample=" + sampleJson,
                "-Dlogback.configurationFile=logback-test.xml",
                "-Dtranslator.id=" + translator.getId(),
                "-Dtranslator.agentId=" + translator.getAgentId(),
                "-Dtranslator.pollduration=" + pollDuration,
                "-Dtranslator.logDir=" + logDir,
                translatorDir + "/" + translator.getFileName() + ".jar");
    }
}
