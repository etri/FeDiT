package kr.co.e8ight.ndxpro.translatorManager.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class Entity implements Serializable {

    @JsonProperty("_id")
    private EntityId id;

    private LinkedHashMap<String, String> attrNames;

    private List<Attribute> attrs;

    private LocalDateTime creDate;

    private LocalDateTime modDate;

    @JsonProperty("@context")
    private String context;

    @Override
    public String toString() {
        return "Entity{" +
                "id=" + id +
                ", attrNames=" + attrNames +
                ", attrs=" + attrs +
                ", creDate=" + creDate +
                ", modDate=" + modDate +
                ", context='" + context + '\'' +
                '}';
    }
}