package org.kafka.connect.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;

/**
 * Drop-in replacement for {@code org.json.XML#toJSONObject(String)},
 * backed by jackson-dataformat-xml.
 *
 * Avoids the JSON License incompatibility with Apache-2.0.
 */
public final class XML {
    private static final XmlMapper XML_MAPPER = new XmlMapper();
    private static final ObjectMapper JSON_MAPPER = new ObjectMapper();

    private XML() {}

    public static JSONObject toJSONObject(String xml) {
        try {
            JsonNode tree = XML_MAPPER.readTree(xml);
            if (tree == null || !tree.isObject()) {
                throw new JSONException("XML did not parse to a JSON object: " + abbreviate(xml));
            }
            // Re-serialize then re-parse to ensure we hold an ObjectNode of the JSON mapper
            String jsonStr = JSON_MAPPER.writeValueAsString(tree);
            return new JSONObject(jsonStr);
        } catch (JsonProcessingException e) {
            throw new JSONException("Failed to parse XML: " + abbreviate(xml), e);
        }
    }

    private static String abbreviate(String s) {
        if (s == null) return "null";
        return s.length() > 200 ? s.substring(0, 200) + "..." : s;
    }
}
