package kr.co.e8ight.ndxpro.translatorRunner.deserializer;

import com.google.gson.JsonObject;
import org.apache.kafka.common.errors.SerializationException;
import org.apache.kafka.common.header.Headers;
import org.apache.kafka.common.serialization.Deserializer;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

public class CommonJsonDeserializer implements Deserializer<JsonObject> {

    private String encoding = StandardCharsets.UTF_8.name();

    @Override
    public JsonObject deserialize(String topic, byte[] data) {
        try {
            if (data == null)
                return null;
            else
                return new com.google.gson.JsonParser().parse(new String(data, encoding)).getAsJsonObject();
        } catch (UnsupportedEncodingException e) {
            throw new SerializationException("Error when deserializing Json to string due to unsupported encoding " + encoding);
        }
    }

    @Override
    public JsonObject deserialize(String topic, Headers headers, byte[] data) {
        return deserialize(topic, data);
    }

    @Override
    public void close() {
        Deserializer.super.close();
    }
}