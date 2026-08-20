package kr.co.e8ight.ndxpro.translatorRunner.util;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.streams.errors.DeserializationExceptionHandler;
import org.apache.kafka.streams.processor.ProcessorContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

public class AlertAndFailDeserializationExceptionHandler implements DeserializationExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AlertAndFailDeserializationExceptionHandler.class);

    private final AlertProcessor alertProcessor;

    public AlertAndFailDeserializationExceptionHandler() {
        alertProcessor = AlertProcessor.INSTANCE;
    }

    @Override
    public DeserializationHandlerResponse handle(ProcessorContext context, ConsumerRecord<byte[], byte[]> record, Exception exception) {
        log.error("Exception caught during Deserialization, taskId: {}, topic: {}, partition: {}, offset: {}",
                new Object[]{context.taskId(), record.topic(), record.partition(), record.offset(), exception});

        alertProcessor.sendAlert(exception);
        return DeserializationHandlerResponse.CONTINUE;
    }

    @Override
    public void configure(Map<String, ?> map) {

    }
}
