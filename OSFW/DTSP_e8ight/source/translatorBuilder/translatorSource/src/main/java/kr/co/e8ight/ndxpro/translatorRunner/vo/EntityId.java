package kr.co.e8ight.ndxpro.translatorRunner.vo;

import java.io.Serializable;

public class EntityId implements Serializable {

    private String id;

    private String type;

    private String servicePath;

    public EntityId(String type, String servicePath) {
        this.id = null;
        this.type = type;
        this.servicePath = servicePath;
    }

    public EntityId(String id, String type, String servicePath) {
        this.id = id;
        this.type = type;
        this.servicePath = servicePath;
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

    public String getServicePath() {
        return servicePath;
    }

    @Override
    public String toString() {
        return "EntityId{" +
                "id='" + id + '\'' +
                ", type='" + type + '\'' +
                ", servicePath='" + servicePath + '\'' +
                '}';
    }
}