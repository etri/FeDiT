package kr.co.e8ight.ndxpro.translatorManager.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.domain.Translator;
import kr.co.e8ight.ndxpro.translatorManager.domain.TranslatorStatus;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;
import kr.co.e8ight.ndxpro.translatorManager.repository.TranslatorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranslatorInspectorService {

    @Value("${translator.inspector.threshold}")
    private Long threshold;

    private final TranslatorRepository translatorRepository;
    private final TranslatorHistoryService translatorHistoryService;

    @Scheduled(fixedDelayString = "${translator.inspector.inspect-duration}")
    @Transactional
    void inspectAgents() {
        List<Translator> translatorList = translatorRepository.findAll();

        translatorList.stream()
                .filter(translator -> translator.getStatus().equals(TranslatorStatus.RUN))
                .filter(translator -> translator.getLastSignalDatetime().isBefore(LocalDateTime.now().minus(threshold, ChronoUnit.MILLIS)))
                .forEach(translator -> {
                    if ( isAlive(translator.getPid()) ) {
                        log.error("translator " + translator.getId() + "( pid : " + translator.getPid() + ") status is hang. Check agent log.");
                        translator.setStatus(TranslatorStatus.HANG);
                        translatorRepository.save(translator);
                    } else {
                        log.error("translator " + translator.getId() + "( pid : " + translator.getPid() + ") status is died. Check agent log.");
                        translator.setPid(null);
                        translator.setStatus(TranslatorStatus.DIED);
                        translatorRepository.save(translator);
                    }
                    translatorHistoryService.recordHistory(translator, "SYSTEM");
                });

        translatorList.stream()
                .filter(translator -> translator.getStatus().equals(TranslatorStatus.HANG))
                .filter(translator -> translator.getLastSignalDatetime().isAfter(LocalDateTime.now().minus(threshold, ChronoUnit.MILLIS)))
                .forEach(translator -> {
                    translator.setStatus(TranslatorStatus.RUN);
                    translatorRepository.save(translator);
                });
    }

    protected boolean isAlive(long pid) {
        try {
            String[] commands = {"/bin/sh", "-c", "ps --no-headers --pid " + pid};

            ProcessBuilder builder = new ProcessBuilder(commands);
            Process checker = builder.start();
            checker.waitFor();

            BufferedReader bufferedReader =
                    new BufferedReader(new InputStreamReader(checker.getInputStream()));
            boolean isRunning = bufferedReader.readLine() != null;

            bufferedReader.close();

            return isRunning;

        } catch (Exception e) {
            throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, "error occurred on ps process cause : " + e.getCause());
        }
    }
}