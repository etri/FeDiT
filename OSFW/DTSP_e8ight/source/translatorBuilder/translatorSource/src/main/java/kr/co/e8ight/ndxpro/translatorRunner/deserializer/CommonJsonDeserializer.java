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
            else {
                String source = new String(data, encoding);
                if ( !(source.startsWith("[") || source.startsWith("{")) ) {
                    return null;
                }
                if ( source.startsWith("[") ) {
                    StringBuilder newSource = new StringBuilder(source);
                    newSource.insert(0, "{ \"data\": ");
                    newSource.append("}");
                    source = newSource.toString();
                }
                return new JSONObject(source);
            }
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