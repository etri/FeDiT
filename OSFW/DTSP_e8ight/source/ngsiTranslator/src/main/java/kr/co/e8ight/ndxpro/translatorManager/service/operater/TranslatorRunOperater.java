package kr.co.e8ight.ndxpro.translatorManager.service.operater;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.domain.Translator;
import kr.co.e8ight.ndxpro.translatorManager.domain.TranslatorStatus;
import kr.co.e8ight.ndxpro.translatorManager.domain.Operater;
import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorCheckRequestDto;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class TranslatorRunOperater extends Operater {

    @Value("${translator.dir}")
    private String translatorDir;

    @Value("${translator.kafka-url}")
    private String kafkaUrl;

    @Value("${translator.default.poll-duration}")
    private String pollDuration;

    @Value("${logging.logstash.url}")
    private String logstashUrl;

    @Value("${logging.file.path}")
    private String logDir;

    @Override
    public Translator operate(Translator translator, TranslatorCheckRequestDto requestDto) {
        return operate(translator);
    }

    @Override
    public Translator operate(Translator translator) {
        if (translator.getStatus().equals(TranslatorStatus.RUN) || translator.getStatus().equals(TranslatorStatus.HANG)) {
            throw new TranslatorException(ErrorCode.OPERATION_NOT_SUPPORTED, "Translator is running already");
        } else {
            Process exec = exec(buildCommand(translator), processOutputFile(logDir, translator.getId()));
            translator.setLastSignalDatetime(LocalDateTime.now());
            translator.setStatus(TranslatorStatus.RUN);
            translator.setPid((int) exec.pid());
            return translator;
        }
    }

    /**
     * java 실행 인자. 인자 구성과 순서는 기존과 동일하며, ProcessBuilder 가 해석하지 못해
     * 의미가 없던 nohup 과 자식 프로그램 인자로 넘어가던 "&" 만 뺐다.
     */
    private List<String> buildCommand(Translator translator) {
        return List.of("java", "-jar",
                "-Dtranslator.mode=run",
                "-Dtranslator.context=" + translator.getContext(),
                "-Dtranslator.model=" + translator.getModelType(),
                "-Dtranslator.sourceTopic=" + translator.getSourceTopic(),
                "-Dtranslator.targetTopic=" + translator.getTargetTopic(),
                "-Dtranslator.classname=kr.co.e8ight.ndxpro.translatorRunner.translator." + translator.getName(),
                "-Dtranslator.kafkaUrl=" + kafkaUrl,
                "-Dtranslator.pollduration=" + pollDuration,
                "-Dlogback.configurationFile=logback.xml",
                "-Dlogstash.url=" + logstashUrl,
                "-Dtranslator.logDir=" + logDir,
                "-Dtranslator.id=" + translator.getId(),
                "-Dtranslator.agentId=" + translator.getAgentId(),
                "-Dtranslator.transferObservedAt=" + translator.getTransferObservedAt(),
                "-Dtranslator.observedAtScenarioId=" + translator.getObservedAtTopicScenarioId(),
                "-Dtranslator.observedAtScenarioType=" + translator.getObservedAtTopicScenarioType(),
                translatorDir + "/" + translator.getFileName() + ".jar");
    }
}
