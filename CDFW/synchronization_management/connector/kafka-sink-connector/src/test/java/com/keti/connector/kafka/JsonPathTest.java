package com.keti.connector.kafka;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotEquals;

public class JsonPathTest {

    @Test
    void validTest() {
        String data = "{\"data\":{\"type\":\"company\",\"name\":\"keti\",\"time\":\"20221128 120524 645\"}}";
        String jsonPath = "$.[?(@.data.name == 'keti')]";
        String expectedData = "[]";
        String result = JsonPath.read(data, jsonPath).toString();
        assertNotEquals(result, expectedData);
    }
}