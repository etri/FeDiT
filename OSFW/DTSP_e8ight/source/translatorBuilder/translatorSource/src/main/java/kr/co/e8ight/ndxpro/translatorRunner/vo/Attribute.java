package kr.co.e8ight.ndxpro.translatorRunner.vo;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONObject;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Attribute implements Serializable {

    private String name;
    private String type;
    private Object value;
    private Map<String, String> mdNames;
    private List<Attribute> md;

    public Attribute(String name, String type, Object value, LinkedHashMap<String, String> mdNames, List<Attribute> md) {
        this.name = name;
        this.type = type;
        this.value = value;
        if ( value.equals(JSONObject.NULL) ) {
            this.value = null;
        }
        this.mdNames = mdNames;
        this.md = md;
    }

    private Attribute(Builder builder) {
        this.name = builder.name;
        this.type = builder.type;
        this.value = builder.value;
        if ( value.equals(JSONObject.NULL) ) {
            this.value = null;
        }
        this.mdNames = builder.mdNames;
        this.md = builder.md;
    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public Object getValue() {
        return value;
    }

    public Map<String, String> getMdNames() {
        return mdNames;
    }

    public List<Attribute> getMd() {
        return md;
    }

    public void setMdNames(Map<String, String> mdNames) {
        this.mdNames = mdNames;
    }

    public void setMd(List<Attribute> md) {
        this.md = md;
    }

    @Override
    public String toString() {
        return "Attribute{" +
                "type='" + type + '\'' +
                ", value=" + value +
                ", mdNames=" + mdNames +
                ", md=" + md +
                '}';
    }

    public static class Builder {
        private String name;
        private String type;
        private Object value;
        private Map<String, String> mdNames;
        private List<Attribute> md;

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder type(String type) {
            this.type = type;
            return this;
        }

        public Builder value(Object value) {
            this.value = value;
            return this;
        }

        public Builder mdNames(Map<String, String> mdNames) {
            this.mdNames = mdNames;
            return this;
        }

        public Builder md(List<Attribute> md) {
            this.md = md;
            return this;
        }

        public Attribute build() {
            return new Attribute(this);
        }
    }
}
