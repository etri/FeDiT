package kr.co.e8ight.ndxpro.translatorRunner.vo;

import java.io.Serializable;
import java.time.ZonedDateTime;

public class ZonedDateTimeVo implements Serializable {
    private ZonedDateTime datetime;
    private Integer scenarioId;
    private String scenarioType;
    private String date;
    private String isFinish;

    public ZonedDateTimeVo(ZonedDateTime datetime, Integer scenarioId, String scenarioType, String date, String isFinish) {
        this.datetime = datetime;
        this.scenarioId = scenarioId;
        this.scenarioType = scenarioType;
        this.date = date;
        this.isFinish = isFinish;
    }

    public ZonedDateTime getDatetime() {
        return datetime;
    }

    public Integer getScenarioId() {
        return scenarioId;
    }

    public String getScenarioType() {
        return scenarioType;
    }

    public void setScenarioId(Integer scenarioId) {
        this.scenarioId = scenarioId;
    }

    public void setScenarioType(String scenarioType) {
        this.scenarioType = scenarioType;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getIsFinish() {
        return isFinish;
    }

    public void setIsFinish(String isFinish) {
        this.isFinish = isFinish;
    }

    public void setDatetime(ZonedDateTime datetime) {
        this.datetime = datetime;
    }
}
