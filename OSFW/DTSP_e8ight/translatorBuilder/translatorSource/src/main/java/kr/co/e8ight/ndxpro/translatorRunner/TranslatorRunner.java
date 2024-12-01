package kr.co.e8ight.ndxpro.translatorRunner;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.translatorRunner.serializer.EntitySerializer;
import kr.co.e8ight.ndxpro.translatorRunner.translator.EntityTranslator;
import kr.co.e8ight.ndxpro.translatorRunner.translator.TestResult;
import kr.co.e8ight.ndxpro.translatorRunner.util.KafkaUtil;
import kr.co.e8ight.ndxpro.translatorRunner.util.SignalProcessor;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.ZonedDateTimeVo;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;

public class TranslatorRunner {

    private static Logger log = LoggerFactory.getLogger(TranslatorRunner.class);
    private static String mode = "test";
    private static String kafkaUrl = "172.16.28.220:19092,172.16.28.220:29092,172.16.28.220:39092,172.16.28.220:49092,172.16.28.220:59092";
    private static String modelType = "DEMODATA";
    private static String context = "DEMODATA";
    private static Long pollDuration = 5000L;
    private static String translatorClassName = "EVCharge_001";
    private static String sampleJson = "{}";
    private static String sourceTopic = "tag";
    private static String observedAtScenarioId = null;
    private static String observedAtScenarioType = null;
    private static Long agentId;
    private static Long translatorId;
    private static EntityTranslator translator;

    private static boolean transferObservedAt = false;

    private static String logDir;

    public static void main(String[] args) {

        SignalProcessor signalProcessor = SignalProcessor.INSTANCE;

        readProperties();
        translator = getTranslator();

        if ( mode.equals("run") ) {
            KafkaUtil kafkaUtil = new KafkaUtil(kafkaUrl);
            KafkaConsumer<Integer, JSONObject> kafkaConsumer = kafkaUtil.getKafkaConsumer(translatorId);
            KafkaProducer<Integer, Entity> kafkaProducer = kafkaUtil.getEntityKafkaProducer();

            String targetTopic = "ngsild.topic";

            kafkaConsumer.subscribe(Collections.singletonList(sourceTopic));

            while (!Thread.currentThread().isInterrupted()) {
                try {
                    ConsumerRecords<Integer, JSONObject> records = kafkaConsumer.poll(Duration.ofMillis(pollDuration));
                    kafkaConsumer.commitAsync();

                    for (ConsumerRecord<Integer, JSONObject> consumerRecord : records) {
                        //init observedAtList
                        List<ZonedDateTime> observedAtList = TranslatorRunner.translator.getObservedAtList();
                        observedAtList.clear();

                        List<Entity> entities = translate(consumerRecord, kafkaUtil, observedAtScenarioId, observedAtScenarioType);

                        //send event
                        for (Entity entity : entities) {
                            entity.setContext(context);
                            ProducerRecord<Integer, Entity> producerRecord = new ProducerRecord<>(targetTopic, entity);
                            kafkaProducer.send(producerRecord);
                        }

                        if ( transferObservedAt ) {
                            //send observedAt
                            observedAtList = TranslatorRunner.translator.getObservedAtList();
                            KafkaProducer<Integer, ZonedDateTimeVo> offsetDateTimeKafkaProducer = kafkaUtil.getZonedDateTimeKafkaProducer();
                            String isFinish;
                            for (int i = 0; i < observedAtList.size(); i++) {
                                if ( i < observedAtList.size() - 1 ) {
                                    isFinish = "N";
                                } else {
                                    isFinish = translator.getIsFinish();
                                }

                                ZonedDateTime observedAt = observedAtList.get(i);
                                ZonedDateTimeVo zonedDateTimeVo = new ZonedDateTimeVo(
                                        observedAt,
                                        translator.getObservedAtTopicScenarioId(),
                                        observedAtScenarioType,
                                        translator.getDate(),
                                        isFinish);

                                ProducerRecord<Integer, ZonedDateTimeVo> producerRecord =
                                        new ProducerRecord<>("observedAt.topic", zonedDateTimeVo);
                                offsetDateTimeKafkaProducer.send(producerRecord);
                            }
                        }

                        //send signal
                        signalProcessor.sendSignal(modelType, translatorId);

                        if ( TranslatorRunner.translator.isOver() ) {
                            translator.setOver(false);
                            signalProcessor.stopSignal(agentId, translatorId);
                        }
                        Thread.sleep(pollDuration);
                    }

                } catch (Exception e) {
                    log.error("TRANSLATE_FAIL: " + e.getMessage());
                    for (StackTraceElement stackTraceElement : e.getStackTrace()) {
                        log.error("at " + stackTraceElement);
                    }
                    Throwable cause = e.getCause();
                    while ( cause != null ) {
                        log.error(cause.getMessage());
                        for (StackTraceElement stackTraceElement : cause.getStackTrace()) {
                            log.error("at " + stackTraceElement);
                        }
                        cause = cause.getCause();
                    }
                }
            }
        } else if ( mode.equals("test") ) {
            log.info("test start");

            String resultJsonPath = logDir + "/translator_" + translatorId + ".json";
            log.info("result json : " + resultJsonPath);

            TestResult result;
            try {
                JSONObject jsonObject = new JSONObject(sampleJson);
                List<Entity> translate = translator.translate(jsonObject);
                result = new TestResult(true, translate.get(0), null);
                saveTestResultJsonFile(result, resultJsonPath);
            } catch (Exception e) {
                log.error("test fail : " + e.getMessage());
                StringBuilder error = new StringBuilder();
                error.append(e.getClass()).append(": ").append(e.getMessage());
                for (StackTraceElement stackTraceElement : e.getStackTrace()) {
                    log.error("at " + stackTraceElement);
                    error.append("at ").append(stackTraceElement);
                }
                result = new TestResult(false, null, error.toString());
                saveTestResultJsonFile(result, resultJsonPath);
                throw e;
            }

            log.info("test end");
        }
    }

    private static void saveTestResultJsonFile(TestResult result, String resultJsonPath) {
        try {
            File file = new File(resultJsonPath);
            if (!file.exists()) {
                file.createNewFile();
            }
            EntitySerializer entitySerializer = new EntitySerializer();
            ObjectMapper objectMapper = entitySerializer.getObjectMapper();

            FileWriter fileWriter = new FileWriter(file);
            BufferedWriter bufferedWriter = new BufferedWriter(fileWriter);

            bufferedWriter.write(objectMapper.writeValueAsString(result));
            bufferedWriter.close();
        } catch (IOException e) {
            log.error("TRANSLATE_FAIL: " + e.getMessage());
            for (StackTraceElement stackTraceElement : e.getStackTrace()) {
                log.error("at " + stackTraceElement);
            }
            Throwable cause = e.getCause();
            while ( cause != null ) {
                log.error(cause.getMessage());
                for (StackTraceElement stackTraceElement : cause.getStackTrace()) {
                    log.error("at " + stackTraceElement);
                }
                cause = cause.getCause();
            }
        }
    }

    private static EntityTranslator getTranslator() {
        try {
            Object object = Class.forName(translatorClassName).getConstructor(String.class).newInstance(modelType);
            if ( object instanceof EntityTranslator) {
                return (EntityTranslator) object;
            } else {
                throw new RuntimeException("No such entity translator.");
            }
        } catch (InstantiationException | IllegalAccessException | InvocationTargetException | NoSuchMethodException |
                 ClassNotFoundException e) {
            String errorMessage = "Kafka error. translator class " + translatorClassName + " is invalid.";
            log.warn(errorMessage, e);
        }
        return null;
    }

    private static List<Entity> translate(ConsumerRecord<Integer, JSONObject> consumerRecord, KafkaUtil kafkaUtil, String observedAtScenarioId, String observedAtScenarioType) {
        JSONObject jsonObject = consumerRecord.value();
        return TranslatorRunner.translator.translate(jsonObject);
    }

    private static void readProperties() {
        mode = System.getProperty("translator.mode");

        if (mode.equals("run")) {
            kafkaUrl = System.getProperty("translator.kafkaUrl");
            pollDuration = Long.valueOf(System.getProperty("translator.pollduration"));
            sourceTopic = System.getProperty("translator.sourceTopic");
            transferObservedAt = Boolean.parseBoolean(System.getProperty("translator.transferObservedAt"));
            observedAtScenarioId = System.getProperty("translator.observedAtScenarioId");
            observedAtScenarioType = System.getProperty("translator.observedAtScenarioType");
        } else if (mode.equals("test")) {
            sampleJson = System.getProperty("translator.sample");
        }
        agentId = Long.valueOf(System.getProperty("translator.agentId"));
        translatorId = Long.valueOf(System.getProperty("translator.id"));
        logDir = System.getProperty("translator.logDir");
        modelType = System.getProperty("translator.model");
        context = System.getProperty("translator.context");
        translatorClassName = System.getProperty("translator.classname");
    }
}
