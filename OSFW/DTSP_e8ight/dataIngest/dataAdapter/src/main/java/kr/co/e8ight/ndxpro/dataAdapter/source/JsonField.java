package kr.co.e8ight.ndxpro.dataAdapter.source;

public class JsonField {
    private String name;
    private Object value;
    private JsonType type;
    private Boolean incremental;

    public String getName() {
        return name;
    }

    public Object getValue() {
        return value;
    }

    public JsonType getType() {
        return type;
    }

    public Boolean getIncremental() {
        return incremental;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public void setType(JsonType type) {
        this.type = type;
    }

    public void setIncremental(Boolean incremental) {
        this.incremental = incremental;
    }

    public JsonField(String name, Object value, JsonType type, Boolean incremental) {
        this.name = name;
        this.value = value;
        this.type = type;
        this.incremental = incremental;
    }

    public void increaseValueIfIncremental() {
        if ( this.incremental ) {
            if ( this.type.equals(JsonType.STRING) ) {
                value = String.valueOf(Long.parseLong((String) value) + 1L);
            } else if ( this.type.equals(JsonType.NUMBER) ) {
                value = (Long) value + 1L;
            }
        }
    }
}

enum JsonType {
    STRING, NUMBER, BOOLEAN
}