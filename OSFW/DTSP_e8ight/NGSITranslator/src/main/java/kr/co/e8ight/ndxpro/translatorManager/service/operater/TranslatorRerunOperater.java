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

@Component
public class TranslatorRerunOperater extends Operater {

    @Value("${translator.dir}")
    private String translatorDir;

    @Value("${translator.kafka-url}")
    private String kafkaUrl;

    @Value("${translator.default.poll-duration}")
    private String pollDuration;

    @Override
    public Translator operate(Translator translator, TranslatorCheckRequestDto requestDto) {
        return operate(translator);
    }

    @Override
    public Translator operate(Translator translator) {
        if (translator.getStatus().equals(TranslatorStatus.RUN) || translator.getStatus().equals(TranslatorStatus.HANG)) {
            killTranslator(translator);

            setCommand(translator);
            log.debug("cmd::::::::::::::::::::::::::" + command);
            Process exec = exec(command.split(" ", -1));
            translator.setLastSignalDatetime(LocalDateTime.now());
            translator.setStatus(TranslatorStatus.RUN);
            translator.setPid((int) exec.pid());
            return translator;
        } else {
            throw new TranslatorException(ErrorCode.OPERATION_NOT_SUPPORTED, "Translator is not running.");
        }
    }

    private void setCommand(Translator translator) {
        command = "nohup java -jar" +
                " -Dtranslator.mode=run" +
                " -Dtranslator.model=" + translator.getModelType() +
                " -Dtranslator.sourceTopic=" + translator.getSourceTopic() +
                " -Dtranslator.classname=kr.co.e8ight.ndxpro.translatorRunner.translator." + translator.getName() +
                " -Dtranslator.kafkaUrl=" + kafkaUrl +
                " -Dtranslator.pollduration=" + pollDuration +
                " -Dlogback.configurationFile=logback.xml" +
                " -Dtranslator.id=" + translator.getId() +
                " -Dtranslator.transferObservedAt=" + translator.getTransferObservedAt() +
                " -Dtranslator.observedAtScenarioId=" + translator.getObservedAtTopicScenarioId() +
                " -Dtranslator.observedAtScenarioType=" + translator.getObservedAtTopicScenarioType() +
                " " + translatorDir +"/"+ translator.getFileName() + ".jar &";
    }
}
