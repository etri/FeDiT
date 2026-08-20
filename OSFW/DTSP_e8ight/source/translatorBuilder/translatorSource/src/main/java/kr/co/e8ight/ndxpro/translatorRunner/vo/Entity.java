package kr.co.e8ight.ndxpro.translatorRunner.vo;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Entity implements Serializable {

    @JsonProperty("_id")
    private EntityId id;

    private Map<String, String> attrNames;

    private List<Attribute> attrs;

    private LocalDateTime creDate;

    private LocalDateTime modDate;

    @JsonProperty("@context")
    private String context;

    public Entity(EntityId id, LinkedHashMap<String, String> attrNames, List<Attribute> attrs, String context) {
        this.id = id;
        this.attrNames = attrNames;
        this.attrs = attrs;
        this.creDate = null;
        this.modDate = null;
        this.context = context;
    }

    private Entity(Builder builder) {
        this.id = builder.id;
        this.attrNames = builder.attrNames;
        this.attrs = builder.attrs;
        this.context = builder.context;
    }

    public EntityId getId() {
        return id;
    }

    public Map<String, String> getAttrNames() {
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

    public static class Builder {
        private EntityId id;
        private Map<String, String> attrNames;
        private List<Attribute> attrs;
        private String context;

        public Builder id(EntityId id) {
            this.id = id;
            return this;
        }

        public Builder attrNames(Map<String, String> attrNames) {
            this.attrNames = attrNames;
            return this;
        }

        public Builder attrs(List<Attribute> attrs) {
            this.attrs = attrs;
            return this;
        }

        public Builder context(String context) {
            this.context = context;
            return this;
        }

        public Entity build() {
            return new Entity(this);
        }
    }
}