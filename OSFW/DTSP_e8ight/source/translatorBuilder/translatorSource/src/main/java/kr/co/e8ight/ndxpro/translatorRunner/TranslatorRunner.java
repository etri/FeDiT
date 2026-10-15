package kr.co.e8ight.ndxpro.translatorRunner;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.translatorRunner.deserializer.CommonJsonDeserializer;
import kr.co.e8ight.ndxpro.translatorRunner.serializer.EntitySerializer;
import kr.co.e8ight.ndxpro.translatorRunner.translator.EntityTranslator;
import kr.co.e8ight.ndxpro.translatorRunner.translator.TestResult;
import kr.co.e8ight.ndxpro.translatorRunner.util.KafkaUtil;
import kr.co.e8ight.ndxpro.translatorRunner.util.SignalProcessor;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.ZonedDateTimeVo;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.errors.RecordDeserializationException;
import org.apache.kafka.common.header.Header;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;

public class TranslatorRunner {

    private static Logger log = LoggerFactory.getLogger(TranslatorRunner.class);
    private static String mode = "test";
    private static String kafkaUrl = "localhost:9092"; // 실행 시 -Dtranslator.kafkaUrl 로 지정
    private static String modelType = "DEMODATA";
    private static String context = "DEMODATA";
    private static Long pollDuration = 5000L;
    private static String translatorClassName = "EVCharge_001";
    private static String sampleJson = "{}";
    private static String sourceTopic = "tag";
    private static String targetTopic = "ngsild_topic";
    private static String observedAtScenarioId = null;
    private static String observedAtScenarioType = null;
    private static Long agentId;
    private static Long translatorId;
    private static EntityTranslator translator;

    private static boolean transferObservedAt = false;

    /** dataIngest 의 kafka sink 가 메시지마다 붙이는 수집 agent id 헤더. */
    public static final String AGENT_ID_HEADER = "ndx-agent-id";

    /** true 면 다른 agent 가 수집한 메시지(헤더의 agent id 가 다른 메시지)를 건너뛴다. */
    private static boolean filterByAgent = true;

    private static String logDir;

    public static void main(String[] args) {

        SignalProcessor signalProcessor = SignalProcessor.INSTANCE;

        readProperties();
        translator = getTranslator();

        if ( mode.equals("run") ) {
            KafkaUtil kafkaUtil = new KafkaUtil(kafkaUrl);
            KafkaConsumer<String, JSONObject> kafkaConsumer = kafkaUtil.getKafkaConsumer(translatorId);
            KafkaProducer<Integer, Entity> kafkaProducer = kafkaUtil.getEntityKafkaProducer();

            kafkaConsumer.subscribe(Collections.singletonList(sourceTopic));

            // offset 은 enable.auto.commit 이 다음 poll() 에서 커밋한다.
            // poll() 직후 바로 커밋하면 처리 도중 실패한 레코드까지 커밋돼 유실되므로 따로 커밋하지 않는다.
            while (!Thread.currentThread().isInterrupted()) {
                ConsumerRecords<String, JSONObject> records;
                try {
                    records = kafkaConsumer.poll(Duration.ofMillis(pollDuration));
                } catch (RecordDeserializationException e) {
                    // 역직렬화 불가 레코드에서 멈추지 않도록 건너뛴다.
                    log.error("skip undeserializable record. partition=" + e.topicPartition() + ", offset=" + e.offset()
                            + "\n" + ExceptionUtils.getStackTrace(e));
                    kafkaConsumer.seek(e.topicPartition(), e.offset() + 1);
                    continue;
                } catch (Exception e) {
                    log.error(ExceptionUtils.getStackTrace(e));
                    continue;
                }

                for (ConsumerRecord<String, JSONObject> consumerRecord : records) {
                    if ( !isTargetRecord(consumerRecord) ) {
                        continue;
                    }
                    // 레코드 하나가 실패해도 같은 배치의 나머지 레코드는 계속 처리한다.
                    try {
                        processRecord(consumerRecord, kafkaUtil, kafkaProducer, signalProcessor);
                        Thread.sleep(pollDuration);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    } catch (Exception e) {
                        log.error("translate fail. partition=" + consumerRecord.partition() + ", offset=" + consumerRecord.offset()
                                + "\n" + ExceptionUtils.getStackTrace(e));
                    }
                }
            }
        } else if ( mode.equals("test") ) {
            log.info("test start");

            String resultJsonPath = logDir + "/translator_" + translatorId + ".json";
            log.info("result json : " + resultJsonPath);

            TestResult result;
            try {
                // run 모드와 같은 규칙으로 변환해 배열 샘플도 검증할 수 있게 한다.
                JSONObject jsonObject = CommonJsonDeserializer.toJsonObject(sampleJson);
                if ( jsonObject == null ) {
                    throw new IllegalArgumentException("sample is not a json object or array.");
                }
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

    /**
     * 변환 대상 레코드인지 판단한다.
     * - value 가 null 이면(JSON 이 아니라 deserializer 가 버린 값) 제외한다.
     * - agent 필터가 켜져 있고 agent id 헤더가 다른 agent 를 가리키면 제외한다.
     *   헤더가 없으면(헤더를 붙이기 전 agent, 외부에서 직접 넣은 메시지) 통과시킨다.
     */
    private static boolean isTargetRecord(ConsumerRecord<String, JSONObject> consumerRecord) {
        if ( consumerRecord.value() == null ) {
            return false;
        }
        if ( !filterByAgent || agentId == null ) {
            return true;
        }
        Header header = consumerRecord.headers().lastHeader(AGENT_ID_HEADER);
        if ( header == null || header.value() == null ) {
            return true;
        }
        String recordAgentId = new String(header.value(), StandardCharsets.UTF_8).trim();
        if ( recordAgentId.equals(String.valueOf(agentId)) ) {
            return true;
        }
        log.debug("skip record of other agent. agentId={}, partition={}, offset={}",
                recordAgentId, consumerRecord.partition(), consumerRecord.offset());
        return false;
    }

    private static void processRecord(ConsumerRecord<String, JSONObject> consumerRecord, KafkaUtil kafkaUtil,
                                      KafkaProducer<Integer, Entity> kafkaProducer, SignalProcessor signalProcessor) {
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

        // signal 은 manager 상태 표시용이다. manager 가 잠시 응답하지 않아도 변환 결과는 이미 전송됐으므로 실패로 보지 않는다.
        try {
            signalProcessor.sendSignal(modelType, translatorId);
        } catch (Exception e) {
            log.warn("signal send fail : " + e.getMessage());
        }

        if ( TranslatorRunner.translator.isOver() ) {
            translator.setOver(false);
            try {
                signalProcessor.stopSignal(agentId, translatorId);
            } catch (Exception e) {
                log.warn("stop signal send fail : " + e.getMessage());
            }
        }
    }

    private static List<Entity> translate(ConsumerRecord<String, JSONObject> consumerRecord, KafkaUtil kafkaUtil, String observedAtScenarioId, String observedAtScenarioType) {
        JSONObject jsonObject = consumerRecord.value();
        return TranslatorRunner.translator.translate(jsonObject);
    }

    private static void readProperties() {
        mode = System.getProperty("translator.mode");

        if (mode.equals("run")) {
            kafkaUrl = System.getProperty("translator.kafkaUrl");
            pollDuration = Long.valueOf(System.getProperty("translator.pollduration"));
            sourceTopic = System.getProperty("translator.sourceTopic");
            String configuredTargetTopic = System.getProperty("translator.targetTopic");
            if ( configuredTargetTopic != null && !configuredTargetTopic.isEmpty() ) {
                targetTopic = configuredTargetTopic;
            }
            transferObservedAt = Boolean.parseBoolean(System.getProperty("translator.transferObservedAt"));
            observedAtScenarioId = System.getProperty("translator.observedAtScenarioId");
            observedAtScenarioType = System.getProperty("translator.observedAtScenarioType");
            // 값이 없으면(이 옵션을 모르는 이전 manager) 필터를 켠다. 헤더 없는 메시지는 어차피 통과한다.
            String configuredFilterByAgent = System.getProperty("translator.filterByAgent");
            filterByAgent = configuredFilterByAgent == null || configuredFilterByAgent.isEmpty() || Boolean.parseBoolean(configuredFilterByAgent);
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
