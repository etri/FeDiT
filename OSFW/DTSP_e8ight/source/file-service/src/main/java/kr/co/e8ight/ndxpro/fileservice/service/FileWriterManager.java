package kr.co.e8ight.ndxpro.fileservice.service;

import jakarta.annotation.PostConstruct;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.FileStatus;
import kr.co.e8ight.ndxpro.fileservice.domain.FileUploadHistory;
import kr.co.e8ight.ndxpro.fileservice.repository.FileUploadHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class FileWriterManager {

    private final FileWriteQueue fileWriteQueue;
    private final FileUploadEvent fileUploadEvent;
    private final FileIoService fileIoService;
    private final FileUploadHistoryRepository fileUploadHistoryRepository;

    private List<Thread> threadList = new ArrayList<>();

    @Value("${file-service.max-fail-count}")
    private Long maxFailCount;

    @Value("${file-service.writer.interval}")
    private Long pollInterval;

    @Value("${file-service.writer.count}")
    private Long count;

    @PostConstruct
    public void setup() {
        Runnable writer = new FileWriter();
        for (int i = 0; i < count; i++) {
            int threadNum = i + 1;
            Thread thread = new Thread(writer, "Writer-Thread-" + threadNum);
            thread.start();
            log.info(thread.getName() + " started.");
            threadList.add(thread);
        }
    }

    class FileWriter implements Runnable {
        @Override
        public void run() {
            while ( true ) {
                try {
                    if ( fileWriteQueue.isEmpty() ) {
                        sleep(pollInterval);
                        continue;
                    }

                    PhysicalFile physicalFile = fileWriteQueue.poll();

                    if ( physicalFile == null ) {
                        continue;
                    }

                    try {
                        fileIoService.writeFile(physicalFile.getPath(), physicalFile.getMultipartFile());
                        saveUploadHistory(physicalFile, "SUCCESS");
                        notifyWriteResult(physicalFile, FileStatus.READY);
                    } catch (Exception e) {
                        log.error(ExceptionUtils.getStackTrace(e));
                        physicalFile.plusUploadFailCount();
                        saveUploadHistory(physicalFile, "FAIL", e.getMessage());

                        if ( physicalFile.getUploadFailCount() < maxFailCount ) {
                            fileWriteQueue.offer(physicalFile);
                        } else {
                            physicalFile.initUploadFailCount();
                            notifyWriteResult(physicalFile, FileStatus.FAIL);
                        }
                    }
                } catch (Throwable t) {
                    // 어떤 예외가 발생해도 Writer 스레드는 죽지 않고 다음 작업을 계속 처리한다.
                    log.error("unexpected error in Writer thread; thread survives.", t);
                }
            }
        }

        private void notifyWriteResult(PhysicalFile physicalFile, FileStatus ready) {
            physicalFile.setStatus(ready);
            fileUploadEvent.notify(physicalFile);
        }

        private void sleep(Long pollInterval) {
            try {
                java.lang.Thread.sleep(pollInterval);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }

        private void saveUploadHistory(PhysicalFile physicalFile, String result) {
            saveUploadHistory(physicalFile, result, null);
        }

        private void saveUploadHistory(PhysicalFile physicalFile, String result, String message) {
            fileUploadHistoryRepository.save(
                    FileUploadHistory.builder()
                            .physicalFile(physicalFile)
                            .dateTime(LocalDateTime.now())
                            .result(result)
                            .message(message)
                            .build());
        }
    }
}

