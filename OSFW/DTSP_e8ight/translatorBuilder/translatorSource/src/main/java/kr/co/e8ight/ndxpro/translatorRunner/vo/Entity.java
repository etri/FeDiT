package kr.co.e8ight.ndxpro.translatorRunner.vo;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;

public class Entity implements Serializable {

    @JsonProperty("_id")
    private EntityId id;

    private LinkedHashMap<String, String> attrNames;

    private List<Attribute> attrs;

    private LocalDateTime creDate;

    private LocalDateTime modDate;

    @JsonProperty("@context")
    private String context;

    public Entity(EntityId id, LinkedHashMap<String, String> attrNames, List<Attribute> attrs) {
        this.id = id;
        this.attrNames = attrNames;
        this.attrs = attrs;
        this.creDate = creDate;
        this.modDate = modDate;
        this.context = context;
    }

    public EntityId getId() {
        return id;
    }

    public LinkedHashMap<String, String> getAttrNames() {
        return attrNames;
    }

    public List<Attribute> getAttrs() {
        return attrs;
    }

    public LocalDateTime getCreDate() {
        return creDate;
    }

    public LocalDateTime getModDate() {
        return modDate;
    }

    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }

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