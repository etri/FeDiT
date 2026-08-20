package kr.co.e8ight.ndxpro.translatorManager.service;

import javax.annotation.PostConstruct;
import kr.co.e8ight.ndxpro.translatorManager.config.OperaterProvider;
import kr.co.e8ight.ndxpro.translatorManager.domain.Operater;
import kr.co.e8ight.ndxpro.translatorManager.domain.Translator;
import kr.co.e8ight.ndxpro.translatorManager.domain.TranslatorOperation;
import kr.co.e8ight.ndxpro.translatorManager.domain.TranslatorStatus;
import kr.co.e8ight.ndxpro.translatorManager.repository.TranslatorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranslatorInspectorService {

  @Value("${translator.inspector.threshold}")
  private Long threshold;

  private final OperaterProvider operaterProvider;
  private final TranslatorRepository translatorRepository;
  private final TranslatorHistoryService translatorHistoryService;

  @PostConstruct
  public void allToStop() {
    List<Translator> translatorList = translatorRepository.findAll();
    translatorList.forEach(translator -> {
      translator.setStatus(TranslatorStatus.STOP);
      translatorRepository.save(translator);
    });
    log.info("All translators have been set to STOP status.");

    // Run Translators
    Operater operater = operaterProvider.getOperater(TranslatorOperation.RUN);
    List<Translator> translators = translatorRepository.findByNameIn(
        List.of(
          "RTSCPedestrianSignalTranslator",
          "TODVehicleSignalTranslator",
          "TODPedestrianTranslator",
          "RTSCVehicleTranslator",
          "RTSCPedestrianTranslator",
          "TODVehicleTranslator",
          "TODPedestrianSignalTranslator",
          "RTSCVehicleSignalTranslator"
        )
      );

    for (Translator translator : translators) {
      Translator operated = operater.operate(translator, null);
      log.info(operated.getName() + " has been started.");
      translatorHistoryService.recordHistory(operated, "SYSTEM");
      translatorRepository.save(operated);
    }
  }

  @Scheduled(fixedDelayString = "${translator.inspector.inspect-duration}")
  @Transactional
  public void inspectAgents() {
    List<Translator> translatorList = translatorRepository.findAll();

    LocalDateTime deadline = LocalDateTime.now().minus(threshold, ChronoUnit.MILLIS);

    translatorList.stream()
      .filter(translator -> translator.getStatus().equals(TranslatorStatus.RUN))
      // 신호 기록이 아예 없는 것도 정지 후보로 본다 (null 이면 NPE 로 스케줄러가 통째로 죽는다)
      .filter(translator -> translator.getLastSignalDatetime() == null
        || translator.getLastSignalDatetime().isBefore(deadline))
      .forEach(translator -> {
        if (!isAlive(translator.getPid())) {
          log.error("translator " + translator.getId() + "( pid : " + translator.getPid()
            + ") status is died. Check agent log.");
          translator.setPid(null);
          translator.setStatus(TranslatorStatus.DIED);
          translatorRepository.save(translator);
          translatorHistoryService.recordHistory(translator, "SYSTEM");

          //rerun agent
          Operater operater = operaterProvider.getOperater(TranslatorOperation.RUN);
          Translator operated = operater.operate(translator, null);
          translatorRepository.save(operated);
          translatorHistoryService.recordHistory(operated, "SYSTEM");
        }
      });
  }

  /**
   * 프로세스 생존 확인. 기존에는 `ps --no-headers --pid` 를 셸로 실행했는데,
   * 이 옵션은 GNU procps 전용이고 컨테이너 이미지에 ps 가 없으면 출력이 비어
   * "죽었다"로 오판한다. 그러면 살아 있는 translator 를 10초마다 중복 기동하게 된다.
   * ProcessHandle 은 외부 명령 없이 커널에 직접 묻는다.
   */
  protected boolean isAlive(Integer pid) {
    if (pid == null) {
      return false;
    }
    return ProcessHandle.of(pid).map(ProcessHandle::isAlive).orElse(false);
  }
}