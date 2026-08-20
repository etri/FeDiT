package kr.co.e8ight.ndxpro.translatorRunner.util;

import org.apache.kafka.streams.errors.StreamsUncaughtExceptionHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AlertAndFailUncaughtExceptionHandler implements StreamsUncaughtExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AlertAndFailUncaughtExceptionHandler.class);

    private final AlertProcessor alertProcessor;

    public AlertAndFailUncaughtExceptionHandler() {
        alertProcessor = AlertProcessor.INSTANCE;
    }

    @Override
    public StreamThreadExceptionResponse handle(Throwable exception) {
        log.error("Exception caught during translating due to : {}", exception);

        alertProcessor.sendAlert(exception);
        return StreamThreadExceptionResponse.REPLACE_THREAD;
    }
}
