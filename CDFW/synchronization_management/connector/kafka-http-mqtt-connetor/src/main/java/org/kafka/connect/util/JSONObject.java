package org.kafka.connect.util;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Drop-in replacement for org.json.JSONObject, backed by Jackson.
 *
 * Provides the subset of the org.json API actually used by this project:
 * construct empty / from string, put primitives and nested objects,
 * get/getJSONObject/getInt/getString, has, toString.
 *
 * Avoids the JSON License ("shall be used for Good, not Evil") incompatibility
 * with Apache-2.0 by relying on jackson-databind (Apache-2.0).
 */
public class JSONObject {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ObjectNode node;

    public JSONObject() {
        this.node = MAPPER.createObjectNode();
    }

    public JSONObject(String json) {
        try {
            JsonNode parsed = MAPPER.readTree(json);
            if (parsed == null || !parsed.isObject()) {
                throw new JSONException("Input is not a JSON object: " + abbreviate(json));
            }
            this.node = (ObjectNode) parsed;
        } catch (JsonProcessingException e) {
            throw new JSONException("Failed to parse JSON: " + abbreviate(json), e);
        }
    }

    public JSONObject(Map<String, ?> map) {
        this.node = MAPPER.createObjectNode();
        if (map != null) {
            for (Map.Entry<String, ?> e : map.entrySet()) {
                put(e.getKey(), e.getValue());
            }
        }
    }

    /** Internal constructor for wrapping an existing ObjectNode. */
    JSONObject(ObjectNode node) {
        this.node = node;
    }

    public JSONObject put(String key, Object value) {
        if (value == null) {
            node.putNull(key);
        } else if (value instanceof String) {
            node.put(key, (String) value);
        } else if (value instanceof Integer) {
            node.put(key, (Integer) value);
        } else if (value instanceof Long) {
            node.put(key, (Long) value);
        } else if (value instanceof Short) {
            node.put(key, ((Short) value).intValue());
        } else if (value instanceof Byte) {
            node.put(key, ((Byte) value).intValue());
        } else if (value instanceof Float) {
            node.put(key, (Float) value);
        } else if (value instanceof Double) {
            node.put(key, (Double) value);
        } else if (value instanceof Boolean) {
            node.put(key, (Boolean) value);
        } else if (value instanceof JSONObject) {
            node.set(key, ((JSONObject) value).node);
        } else if (value instanceof JsonNode) {
            node.set(key, (JsonNode) value);
        } else if (value instanceof Map) {
            ObjectNode child = MAPPER.createObjectNode();
            for (Map.Entry<?, ?> e : ((Map<?, ?>) value).entrySet()) {
                JSONObject wrap = new JSONObject(child);
                wrap.put(String.valueOf(e.getKey()), e.getValue());
            }
            node.set(key, child);
        } else if (value instanceof Iterable) {
            ArrayNode arr = MAPPER.createArrayNode();
            for (Object item : (Iterable<?>) value) {
                if (item == null) {
                    arr.addNull();
                } else if (item instanceof String) {
                    arr.add((String) item);
                } else if (item instanceof Integer) {
                    arr.add((Integer) item);
                } else if (item instanceof Long) {
                    arr.add((Long) item);
                } else if (item instanceof Double) {
                    arr.add((Double) item);
                } else if (item instanceof Boolean) {
                    arr.add((Boolean) item);
                } else if (item instanceof JSONObject) {
                    arr.add(((JSONObject) item).node);
                } else if (item instanceof JsonNode) {
                    arr.add((JsonNode) item);
                } else {
                    arr.add(item.toString());
                }
            }
            node.set(key, arr);
        } else {
            node.put(key, value.toString());
        }
        return this;
    }

    public boolean has(String key) {
        return node.has(key);
    }

    public Object get(String key) {
        JsonNode v = node.get(key);
        if (v == null || v.isNull()) {
            throw new JSONException("JSONObject[\"" + key + "\"] not found.");
        }
        if (v.isObject()) return new JSONObject((ObjectNode) v);
        if (v.isTextual()) return v.asText();
        if (v.isInt()) return v.asInt();
        if (v.isLong()) return v.asLong();
        if (v.isDouble() || v.isFloat()) return v.asDouble();
        if (v.isBoolean()) return v.asBoolean();
        return v;
    }

    public String getString(String key) {
        JsonNode v = node.get(key);
        if (v == null || v.isNull()) {
            throw new JSONException("JSONObject[\"" + key + "\"] not found.");
        }
        return v.asText();
    }

    public int getInt(String key) {
        JsonNode v = node.get(key);
        if (v == null || v.isNull()) {
            throw new JSONException("JSONObject[\"" + key + "\"] not found.");
        }
        if (v.canConvertToInt()) return v.asInt();
        try {
            return Integer.parseInt(v.asText());
        } catch (NumberFormatException nfe) {
            throw new JSONException(
                "JSONObject[\"" + key + "\"] is not an int: " + v.asText());
        }
    }

    public long getLong(String key) {
        JsonNode v = node.get(key);
        if (v == null || v.isNull()) {
            throw new JSONException("JSONObject[\"" + key + "\"] not found.");
        }
        if (v.canConvertToLong()) return v.asLong();
        try {
            return Long.parseLong(v.asText());
        } catch (NumberFormatException nfe) {
            throw new JSONException(
                "JSONObject[\"" + key + "\"] is not a long: " + v.asText());
        }
    }

    public double getDouble(String key) {
        JsonNode v = node.get(key);
        if (v == null || v.isNull()) {
            throw new JSONException("JSONObject[\"" + key + "\"] not found.");
        }
        return v.asDouble();
    }

    public boolean getBoolean(String key) {
        JsonNode v = node.get(key);
        if (v == null || v.isNull()) {
            throw new JSONException("JSONObject[\"" + key + "\"] not found.");
        }
        return v.asBoolean();
    }

    public JSONObject getJSONObject(String key) {
        JsonNode v = node.get(key);
        if (v == null || v.isNull()) {
            throw new JSONException("JSONObject[\"" + key + "\"] not found.");
        }
        if (!v.isObject()) {
            throw new JSONException("JSONObject[\"" + key + "\"] is not a JSONObject.");
        }
        return new JSONObject((ObjectNode) v);
    }

    public String optString(String key) {
        return optString(key, "");
    }

    public String optString(String key, String defaultValue) {
        JsonNode v = node.get(key);
        return (v == null || v.isNull()) ? defaultValue : v.asText();
    }

    public int optInt(String key) {
        return optInt(key, 0);
    }

    public int optInt(String key, int defaultValue) {
        JsonNode v = node.get(key);
        return (v == null || v.isNull()) ? defaultValue : v.asInt(defaultValue);
    }

    public boolean optBoolean(String key) {
        return optBoolean(key, false);
    }

    public boolean optBoolean(String key, boolean defaultValue) {
        JsonNode v = node.get(key);
        return (v == null || v.isNull()) ? defaultValue : v.asBoolean(defaultValue);
    }

    public Iterator<String> keys() {
        return node.fieldNames();
    }

    public Set<String> keySet() {
        Set<String> keys = new HashSet<>();
        Iterator<String> it = node.fieldNames();
        while (it.hasNext()) keys.add(it.next());
        return keys;
    }

    public int length() {
        return node.size();
    }

    /** Access to the underlying Jackson node. Use sparingly. */
    public JsonNode asJsonNode() {
        return node;
    }

    @Override
    public String toString() {
        return node.toString();
    }

    private static String abbreviate(String s) {
        if (s == null) return "null";
        return s.length() > 200 ? s.substring(0, 200) + "..." : s;
    }
}
