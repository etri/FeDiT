package kr.co.e8ight.ndxpro.translatorRunner.serializer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import kr.co.e8ight.ndxpro.translatorRunner.vo.ZonedDateTimeVo;
import org.apache.kafka.common.serialization.Serializer;

import java.util.Map;

public class ZonedDatetimeSerializer implements Serializer<ZonedDateTimeVo> {

    private final ObjectMapper objectMapper;

    public ZonedDatetimeSerializer() {
        JavaTimeModule module = new JavaTimeModule();
        module.addSerializer(new ZonedDateTimeJsonSerializer());
        this.objectMapper = new ObjectMapper().registerModule(module);
    }

    @Override
    public void configure(Map configs, boolean isKey) {
        Serializer.super.configure(configs, isKey);
    }

    @Override
    public byte[] serialize(String topic, ZonedDateTimeVo data) {
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


