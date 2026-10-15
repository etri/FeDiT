package kr.co.e8ight.ndxpro.translatorRunner.deserializer;

import org.apache.kafka.common.header.Headers;
import org.apache.kafka.common.serialization.Deserializer;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;

public class CommonJsonDeserializer implements Deserializer<JSONObject> {

    private static final Logger log = LoggerFactory.getLogger(CommonJsonDeserializer.class);

    /** 배열 메시지를 감쌀 때 쓰는 키. translator 코드는 jsonObject.getJSONArray("data") 로 꺼낸다. */
    public static final String ARRAY_WRAP_KEY = "data";

    private static final int LOG_PREVIEW_LENGTH = 200;

    /**
     * 여기서 예외를 던지면 KafkaConsumer.poll() 이 같은 offset 에서 계속 실패해 파티션이 멈춘다.
     * 그래서 JSON 이 아닌 값은 예외 대신 null 을 반환하고, runner 가 null 레코드를 건너뛴다.
     */
    @Override
    public JSONObject deserialize(String topic, byte[] data) {
        if ( data == null ) {
            return null;
        }
        JSONObject jsonObject = toJsonObject(new String(data, StandardCharsets.UTF_8));
        if ( jsonObject == null ) {
            log.warn("skip non-json message. topic={}, size={}, value={}", topic, data.length, preview(data));
        }
        return jsonObject;
    }

    @Override
    public JSONObject deserialize(String topic, Headers headers, byte[] data) {
        return Deserializer.super.deserialize(topic, headers, data);
    }

    @Override
    public void close() {
        Deserializer.super.close();
    }

    /**
     * 문자열을 JSONObject 로 변환한다.
     * 객체는 그대로, 배열은 {"data": [...]} 로 감싸고, 그 외(빈 값, 평문, 깨진 JSON)는 null 을 반환한다.
     * 앞에 붙은 UTF-8 BOM 과 공백은 무시한다.
     */
    public static JSONObject toJsonObject(String source) {
        if ( source == null ) {
            return null;
        }
        String trimmed = source.startsWith("﻿") ? source.substring(1).trim() : source.trim();
        try {
            if ( trimmed.startsWith("{") ) {
                return new JSONObject(trimmed);
            }
            if ( trimmed.startsWith("[") ) {
                return new JSONObject().put(ARRAY_WRAP_KEY, new JSONArray(trimmed));
            }
        } catch (JSONException e) {
            log.debug("json parse fail : {}", e.getMessage());
        }
        return null;
    }

    private static String preview(byte[] data) {
        String value = new String(data, StandardCharsets.UTF_8);
        return value.length() > LOG_PREVIEW_LENGTH ? value.substring(0, LOG_PREVIEW_LENGTH) + "..." : value;
    }
}
