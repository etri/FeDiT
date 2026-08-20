package kr.co.e8ight.ndxpro.translatorManager.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.LinkedHashMap;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Attribute implements Serializable {

    private String name;
    private String type;
    private Object value;
    private LinkedHashMap<String, String> mdNames;
    private List<Attribute> md;

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
