package kr.co.e8ight.ndxpro.translatorRunner.util;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.streams.errors.ProductionExceptionHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

public class AlertAndFailProductionExceptionHandler implements ProductionExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AlertAndFailProductionExceptionHandler.class);

    private final AlertProcessor alertProcessor;

    public AlertAndFailProductionExceptionHandler() {
        alertProcessor = AlertProcessor.INSTANCE;
    }

    @Override
    public ProductionExceptionHandlerResponse handle(ProducerRecord<byte[], byte[]> record, Exception exception) {
        log.error("Exception caught during Production, topic: {}, partition: {}",
                new Object[]{record.topic(), record.partition(), exception});

        alertProcessor.sendAlert(exception);
        return ProductionExceptionHandlerResponse.CONTINUE;
    }

    @Override
    public void configure(Map<String, ?> map) {

    }
}
