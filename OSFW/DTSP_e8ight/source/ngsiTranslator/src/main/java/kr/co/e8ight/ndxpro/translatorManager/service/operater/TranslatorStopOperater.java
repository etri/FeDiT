package kr.co.e8ight.ndxpro.translatorManager.service.operater;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.domain.Translator;
import kr.co.e8ight.ndxpro.translatorManager.domain.TranslatorStatus;
import kr.co.e8ight.ndxpro.translatorManager.domain.Operater;
import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorCheckRequestDto;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;
import org.springframework.stereotype.Component;

@Component
public class TranslatorStopOperater extends Operater {

    @Override
    public Translator operate(Translator translator, TranslatorCheckRequestDto requestDto) {
        return operate(translator);
    }

    @Override
    public Translator operate(Translator translator) {
        if (translator.getStatus().equals(TranslatorStatus.RUN) || translator.getStatus().equals(TranslatorStatus.HANG)) {
            killTranslator(translator);

            translator.setStatus(TranslatorStatus.STOP);
            translator.setPid(null);
        }
        return translator;
    }
}
