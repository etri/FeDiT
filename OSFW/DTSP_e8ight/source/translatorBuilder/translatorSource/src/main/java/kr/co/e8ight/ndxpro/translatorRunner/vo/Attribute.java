package kr.co.e8ight.ndxpro.translatorRunner.vo;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;
import java.util.LinkedHashMap;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Attribute implements Serializable {

    private String name;
    private String type;
    private Object value;
    private LinkedHashMap<String, String> mdNames;
    private List<Attribute> md;

    public Attribute(String name, String type, Object value, LinkedHashMap<String, String> mdNames, List<Attribute> md) {
        this.name = name;
        this.type = type;
        this.value = value;
        this.mdNames = mdNames;
        this.md = md;
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

    public LinkedHashMap<String, String> getMdNames() {
        return mdNames;
    }

    public List<Attribute> getMd() {
        return md;
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
}
