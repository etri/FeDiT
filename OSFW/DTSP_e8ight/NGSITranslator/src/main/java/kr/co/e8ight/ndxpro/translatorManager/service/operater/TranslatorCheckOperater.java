package kr.co.e8ight.ndxpro.translatorManager.service.operater;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.domain.Translator;
import kr.co.e8ight.ndxpro.translatorManager.domain.Operater;
import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorCheckRequestDto;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class TranslatorCheckOperater extends Operater {

    @Value("${translator.dir}")
    private String translatorDir;

    @Value("${logging.file.path}")
    private String logDir;

    @Override
    public Translator operate(Translator translator, TranslatorCheckRequestDto requestDto) {
        try {
            String sampleJson = requestDto.getSampleJson();
            String[] commands = getCommands(translator, sampleJson);
            log.debug("cmd::::::::::::::::::::::::::" + Arrays.toString(commands));
            Process exec = exec(commands);
            exec.waitFor();
        } catch (InterruptedException e) {
            throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }

        return translator;
    }

    @Override
    public Translator operate(Translator translator) {
        throw new TranslatorException(ErrorCode.OPERATION_NOT_SUPPORTED, "TranslatorCheckRequestDto is required.");
    }

    private String[] getCommands(Translator translator, String sampleJson) {
        String[] commands = new String[10];

        commands[0] = "java";
        commands[1] = "-jar";
        commands[2] = "-Dtranslator.mode=test";
        commands[3] = "-Dtranslator.model=" + translator.getModelType();
        commands[4] = "-Dtranslator.classname=kr.co.e8ight.ndxpro.translatorRunner.translator." + translator.getName();
        commands[5] = "-Dtranslator.sample=" + sampleJson;
        commands[6] = "-Dlogback.configurationFile=logback-test.xml";
        commands[7] = "-Dtranslator.id=" + translator.getId();
        commands[8] = "-Dtranslator.logDir=" + logDir;
        commands[9] = translatorDir +"/"+ translator.getFileName() + ".jar";
        return commands;
    }
}
