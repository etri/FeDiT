package kr.co.e8ight.ndxpro.translatorRunner.vo;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

public class IngestInterfaceVo implements Serializable {

    private String modelType;
    private List<Map<String,Object>> entities;

    public String getModelType() {
        return modelType;
    }

    public void setModelType(String modelType) {
        this.modelType = modelType;
    }

    public List<Map<String,Object>> getEntities() {
        return entities;
    }

    public void setEntities(List<Map<String,Object>> entities) {
        this.entities = entities;
    }

    @Override
    public String toString() {
        return "IngestInterfaceVO{" +
                "modelType='" + modelType + '\'' +
                ", entities=" + entities +
                '}';
    }
}