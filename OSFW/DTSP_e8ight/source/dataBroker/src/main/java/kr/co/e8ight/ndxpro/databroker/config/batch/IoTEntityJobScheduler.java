package kr.co.e8ight.ndxpro.databroker.config.batch;

import kr.co.e8ight.ndxpro.databroker.config.batch.job.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
public class IoTEntityJobScheduler {

    private final JobLauncher jobLauncher;

    private final IoTEntitySuccessJob successIoTEntityJob;

    private final IoTEntityFailJob failIoTEntityJob;

    public IoTEntityJobScheduler(JobLauncher jobLauncher, IoTEntitySuccessJob successIoTEntityJob, IoTEntityFailJob failIoTEntityJob) {
        this.jobLauncher = jobLauncher;
        this.successIoTEntityJob = successIoTEntityJob;
        this.failIoTEntityJob = failIoTEntityJob;
    }

    @Scheduled(cron = "0 0 02 * * *")
    public void scheduleEntityJob() {
        try {
            jobLauncher.run(
                    successIoTEntityJob.startEntityJob(),
                    new JobParametersBuilder()
                            .addString("datetime", LocalDateTime.now().toString())
                            .toJobParameters());
            log.debug("successfully complete scheduleEntityJob");
        } catch (Exception e) {
            e.getMessage();
        }
    }

    @Scheduled(cron = "0 0 02 * * *")
    public void scheduleInvalidEntityJob() {
        try {
            jobLauncher.run(
                    failIoTEntityJob.startInvalidEntityJob(),
                    new JobParametersBuilder()
                            .addString("datetime", LocalDateTime.now().toString())
                            .toJobParameters());
            log.debug("successfully complete scheduleInvalidEntityJob");
        } catch (Exception e) {
            e.getMessage();
        }
    }
}
