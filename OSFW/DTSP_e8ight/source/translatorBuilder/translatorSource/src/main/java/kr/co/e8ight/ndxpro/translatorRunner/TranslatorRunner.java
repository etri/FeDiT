package kr.co.e8ight.ndxpro.translatorRunner;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.List;
import java.util.Properties;
import kr.co.e8ight.ndxpro.translatorRunner.deserializer.CommonJsonDeserializer;
import kr.co.e8ight.ndxpro.translatorRunner.deserializer.EntityDeserializer;
import kr.co.e8ight.ndxpro.translatorRunner.serializer.EntitySerializer;
import kr.co.e8ight.ndxpro.translatorRunner.translator.EPCTranslator;
import kr.co.e8ight.ndxpro.translatorRunner.translator.EntityTranslator;
import kr.co.e8ight.ndxpro.translatorRunner.translator.TestResult;
import kr.co.e8ight.ndxpro.translatorRunner.util.AlertAndFailUncaughtExceptionHandler;
import kr.co.e8ight.ndxpro.translatorRunner.util.AlertProcessor;
import kr.co.e8ight.ndxpro.translatorRunner.util.KafkaUtil;
import kr.co.e8ight.ndxpro.translatorRunner.util.SignalProcessor;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Mode;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.kafka.common.serialization.Serde;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.Topology;
import org.apache.kafka.streams.kstream.Branched;
import org.apache.kafka.streams.kstream.Consumed;
import org.apache.kafka.streams.kstream.Produced;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TranslatorRunner {

    private static Logger log = LoggerFactory.getLogger(TranslatorRunner.class);
    private static String mode;
    private static String kafkaUrl;
    private static String translatorClassName;
    private static String sampleJson;
    private static String sourceTopic;
    private static String targetTopic;
    private static String context;
    private static String dataIngestUrl;
    private static Long translatorId;
    private static Long dataSourceId;
    private static EntityTranslator translator;

    private static String logDir;

    public static void main(String[] args) {
        setup();
        translator = getTranslator();

        if ( mode.equals(Mode.RUN) ) {
            try {
                topic2Stream();
            } catch (Exception e) {
                log.error(ExceptionUtils.getStackTrace(e));
            }
        } else if ( mode.equals(Mode.TEST) ) {
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
                log.error(ExceptionUtils.getStackTrace(e));
                result = new TestResult(false, null, ExceptionUtils.getStackTrace(e));
                saveTestResultJsonFile(result, resultJsonPath);
                throw e;
            }

            log.info("test end");
        }
    }

    private static void topic2Stream() {
        KafkaUtil kafkaUtil = new KafkaUtil(kafkaUrl);
        Properties kafkaStreamsProperties = kafkaUtil.getKafkaStreamsProperties(translatorId);
        SignalProcessor signalProcessor = SignalProcessor.INSTANCE;

        CommonJsonDeserializer commonJsonDeserializer = new CommonJsonDeserializer();
//        Serde<JSONObject> jsonObjectSerde = Serdes.serdeFrom(new JsonObjectSerializer(), new CommonJsonDeserializer());
        Serde<Entity> entitySerde = Serdes.serdeFrom(new EntitySerializer(), new EntityDeserializer());

        StreamsBuilder builder = new StreamsBuilder();

//        builder.stream(sourceTopic, Consumed.with(Serdes.String(), jsonObjectSerde).withOffsetResetPolicy(Topology.AutoOffsetReset.LATEST))
        builder.stream(sourceTopic, Consumed.with(Serdes.String(), new Serdes.ByteArraySerde(), null, Topology.AutoOffsetReset.LATEST))
            .split()
            .branch((key, value) -> "EPC".equals(key), Branched.withConsumer(ks ->
                ks.mapValues(value -> commonJsonDeserializer.deserialize(sourceTopic, value))
                .filter((key, value) -> value != null)
                .mapValues(TranslatorRunner::makeNgsiLdForEPC)
                .filter((key, value) -> value != null)
                .peek((key, value) -> {
                    log.info("receive data from datasource " + key);
                    signalProcessor.sendSignal(translatorId);
                })
                .flatMapValues(value -> value)
                .filter((key, value) -> value != null)
                .to(targetTopic, Produced.with(Serdes.String(), entitySerde))))
            .defaultBranch(Branched.withConsumer(ks ->
                ks.filter((key, value) -> key != null && key.equals(String.valueOf(dataSourceId)))
                    .mapValues(value -> commonJsonDeserializer.deserialize(sourceTopic, value))
                    .filter((key, value) -> value != null)
                    .mapValues(TranslatorRunner::makeNgsiLd)
                    .filter((key, value) -> value != null)
                    .peek((key, value) -> {
                        log.info("receive data from datasource " + key);
                        signalProcessor.sendSignal(translatorId);
                    })
                    .flatMapValues(value -> value)
                    .filter((key, value) -> value != null)
                    .to(targetTopic, Produced.with(Serdes.String(), entitySerde))));

        KafkaStreams streams = new KafkaStreams(builder.build(), kafkaStreamsProperties);
        streams.setUncaughtExceptionHandler(new AlertAndFailUncaughtExceptionHandler());
        streams.start();
    }

    private static List<Entity> makeNgsiLdForEPC(JSONObject jsonObject) {
        try {
            EPCTranslator epcTranslator = new EPCTranslator(context);
          return epcTranslator.translate(jsonObject);
        } catch (Exception e) {
            log.error(ExceptionUtils.getStackTrace(e));
            AlertProcessor alertProcessor = AlertProcessor.INSTANCE;
            alertProcessor.sendAlert(e);
            return null;
        }
    }

    private static List<Entity> makeNgsiLd(JSONObject jsonObject) {
        try {
            return TranslatorRunner.translator.translate(jsonObject);
        } catch (Exception e) {
            log.error(ExceptionUtils.getStackTrace(e));
            AlertProcessor alertProcessor = AlertProcessor.INSTANCE;
            alertProcessor.sendAlert(e);
            return null;
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
            log.error(ExceptionUtils.getStackTrace(e));
        }
    }

    private static EntityTranslator getTranslator() {
        try {
            Object object = Class.forName(translatorClassName).getConstructor(String.class).newInstance(context);
            if ( object instanceof EntityTranslator) {
                return (EntityTranslator) object;
            } else {
                throw new RuntimeException("No such entity translator.");
            }
        } catch (InstantiationException | IllegalAccessException | InvocationTargetException | NoSuchMethodException |
                 ClassNotFoundException e) {
            String errorMessage = "Kafka error. translator class " + translatorClassName + " is invalid.";
            log.error(errorMessage, e);
        }
        return null;
    }

    private static void setup() {
        mode = System.getProperty("translator.mode");
        translatorId = Long.valueOf(System.getProperty("translator.id"));
        context = System.getProperty("translator.context");
        logDir = System.getProperty("translator.logDir");
        translatorClassName = System.getProperty("translator.classname");

        if (mode.equals("run")) {
            kafkaUrl = System.getProperty("translator.kafkaUrl");
            sourceTopic = System.getProperty("translator.sourceTopic");
            targetTopic = System.getProperty("translator.targetTopic");
            dataSourceId = Long.valueOf(System.getProperty("translator.dataSourceId"));
            dataIngestUrl = System.getProperty("dataIngest.url");

            AlertProcessor alertProcessor = AlertProcessor.INSTANCE;
            alertProcessor.setup(translatorId, dataSourceId, dataIngestUrl);
        } else if (mode.equals("test")) {
            sampleJson = System.getProperty("translator.sample");
        }
    }
}
