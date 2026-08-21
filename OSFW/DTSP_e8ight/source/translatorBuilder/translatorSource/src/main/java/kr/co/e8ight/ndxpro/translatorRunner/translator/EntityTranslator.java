package kr.co.e8ight.ndxpro.translatorRunner.translator;

import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import org.json.JSONObject;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

public abstract class EntityTranslator {
    private List<ZonedDateTime> observedAtList = new ArrayList<>();
    private LocalDateTime observedAt;
    private boolean over = false;
    private Integer observedAtTopicScenarioId;
    private String isFinish;
    private String date;

    public abstract List<Entity> translate(JSONObject value);

    public List<ZonedDateTime> getObservedAtList() {
        return observedAtList;
    }

    public void setObservedAtList(List<ZonedDateTime> observedAtList) {
        this.observedAtList = observedAtList;
    }

    public LocalDateTime getObservedAt() {
        return observedAt;
    }

    public boolean isOver() {
        return over;
    }

    public Integer getObservedAtTopicScenarioId() {
        return observedAtTopicScenarioId;
    }

    public void setObservedAt(LocalDateTime observedAt) {
        this.observedAt = observedAt;
    }

    public void setOver(boolean over) {
        this.over = over;
    }

    public void setObservedAtTopicScenarioId(Integer observedAtTopicScenarioId) {
        this.observedAtTopicScenarioId = observedAtTopicScenarioId;
    }

    public String getIsFinish() {
        return isFinish;
    }

    public void setIsFinish(String isFinish) {
        this.isFinish = isFinish;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }
}
