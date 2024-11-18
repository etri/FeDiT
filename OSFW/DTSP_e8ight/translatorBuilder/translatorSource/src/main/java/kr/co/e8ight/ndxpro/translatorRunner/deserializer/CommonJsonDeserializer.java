package kr.co.e8ight.ndxpro.translatorRunner.deserializer;

import org.apache.kafka.common.errors.SerializationException;
import org.apache.kafka.common.header.Headers;
import org.apache.kafka.common.serialization.Deserializer;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

public class CommonJsonDeserializer implements Deserializer<JSONObject> {

    private String encoding = StandardCharsets.UTF_8.name();

    @Override
    public JSONObject deserialize(String topic, byte[] data) {
        try {
            if (data == null)
                return null;
            else
                return new JSONObject(new String(data, encoding));
        } catch (UnsupportedEncodingException e) {
            throw new SerializationException("Error when deserializing Json to string due to unsupported encoding " + encoding);
        }
    }

    @Override
    public JSONObject deserialize(String topic, Headers headers, byte[] data) {
        return Deserializer.super.deserialize(topic, headers, data);
    }

    @Override
    public void close() {
        Deserializer.super.close();
    }
}