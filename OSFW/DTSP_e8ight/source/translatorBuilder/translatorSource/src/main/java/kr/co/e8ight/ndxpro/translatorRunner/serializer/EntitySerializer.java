package kr.co.e8ight.ndxpro.translatorRunner.serializer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import org.apache.kafka.common.serialization.Serializer;

import java.time.format.DateTimeFormatter;
import java.util.Map;

public class EntitySerializer implements Serializer<Entity> {

    private final ObjectMapper objectMapper;

    public ObjectMapper getObjectMapper() {
        return objectMapper;
    }

    public EntitySerializer() {
        JavaTimeModule module = new JavaTimeModule();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");
        LocalDateTimeSerializer localDateTimeSerializer = new LocalDateTimeSerializer(formatter);

        module.addSerializer(localDateTimeSerializer);
        module.addSerializer(new ZonedDateTimeJsonSerializer());
        this.objectMapper = new ObjectMapper().registerModule(module);
    }

    @Override
    public void configure(Map configs, boolean isKey) {
        Serializer.super.configure(configs, isKey);
    }

    @Override
    public byte[] serialize(String topic, Entity data) {
        try {
            return objectMapper.writeValueAsBytes(data);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    public void close() {
        Serializer.super.close();
    }
}

