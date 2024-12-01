package kr.co.e8ight.ndxpro.translatorManager.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class EntityId implements Serializable {

    private String id;

    private String type;

    private String servicePath;

    @Override
    public String toString() {
        return "EntityId{" +
                "id='" + id + '\'' +
                ", type='" + type + '\'' +
                ", servicePath='" + servicePath + '\'' +
                '}';
    }
}