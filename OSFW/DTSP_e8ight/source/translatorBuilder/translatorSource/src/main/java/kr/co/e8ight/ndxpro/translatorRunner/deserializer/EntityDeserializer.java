package kr.co.e8ight.ndxpro.translatorRunner.deserializer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import org.apache.kafka.common.errors.SerializationException;
import org.apache.kafka.common.header.Headers;
import org.apache.kafka.common.serialization.Deserializer;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

public class EntityDeserializer implements Deserializer<Entity> {

    private String encoding = StandardCharsets.UTF_8.name();

    private final ObjectMapper objectMapper;

    public EntityDeserializer() {
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public Entity deserialize(String topic, byte[] data) {
        try {
            if (data == null)
                return null;
            else
                return objectMapper.readValue(new String(data, encoding), Entity.class);
        } catch (UnsupportedEncodingException | JsonProcessingException e) {
            throw new SerializationException("Error when deserializing Json to string due to unsupported encoding " + encoding);
        }
    }

    @Override
    public Entity deserialize(String topic, Headers headers, byte[] data) {
        return Deserializer.super.deserialize(topic, headers, data);
    }

    @Override
    public void close() {
        Deserializer.super.close();
    }
}