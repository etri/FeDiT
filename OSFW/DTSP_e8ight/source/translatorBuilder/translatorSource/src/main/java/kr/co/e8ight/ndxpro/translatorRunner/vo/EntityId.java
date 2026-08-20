package kr.co.e8ight.ndxpro.translatorRunner.vo;

import java.io.Serializable;

public class EntityId implements Serializable {

    private String id;

    private String type;

    private String provider;

    public EntityId(String type, String provider) {
        this.id = null;
        this.type = type;
        this.provider = provider;
    }

    public EntityId(String id, String type, String provider) {
        this.id = id;
        this.type = type;
        this.provider = provider;
    }

    private EntityId(Builder builder) {
        this.id = "urn:ngsi-ld:" + builder.type + ":" + builder.id;
        this.type = builder.type;
        this.provider = builder.provider;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public String getProvider() {
        return provider;
    }

    @Override
    public String toString() {
        return "EntityId{" +
                "id='" + id + '\'' +
                ", type='" + type + '\'' +
                ", servicePath='" + provider + '\'' +
                '}';
    }

    public static class Builder {
        private String id;
        private String type;
        private String provider;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder type(String type) {
            this.type = type;
            return this;
        }

        public Builder provider(String provider) {
            this.provider = provider;
            return this;
        }

        public EntityId build() {
            return new EntityId(this);
        }
    }
}