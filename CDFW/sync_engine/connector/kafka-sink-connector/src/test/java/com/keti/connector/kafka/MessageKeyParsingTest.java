package com.keti.connector.kafka;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class MessageKeyParsingTest {

    @Test
    void parsingMessageKeyTest() {

        String data = "{\"data\":{\"type\":\"company\",\"name\":\"keti\",\"time\":\"20221128 120524 645\"}}";
        String keyField = "@.data.name";
        StringBuilder messageKey = new StringBuilder();
        List<String> fields = Arrays.asList(keyField.split(","));
        for (String field : fields) {
            messageKey.append(JsonPath.read(data, field).toString());
        }
        assertEquals("keti", messageKey.toString());
    }

    @Test
    void parsingMessageKeysTest() {

        String data = "{\"data\":{\"type\":\"company\",\"name\":\"keti\",\"time\":\"20221128 120524 645\"}}";
        String keysField = "@.data.type,@.data.name";
        StringBuilder messageKey = new StringBuilder();
        List<String> fields = Arrays.asList(keysField.split(","));
        for (String field : fields) {
            messageKey.append(JsonPath.read(data, field).toString());
        }
        assertEquals("companyketi", messageKey.toString());
    }
}
