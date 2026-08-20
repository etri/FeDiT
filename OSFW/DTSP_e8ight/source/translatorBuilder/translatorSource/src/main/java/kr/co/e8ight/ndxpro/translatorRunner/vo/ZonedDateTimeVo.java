package kr.co.e8ight.ndxpro.translatorRunner.vo;

import java.io.Serializable;
import java.time.ZonedDateTime;

public class ZonedDateTimeVo implements Serializable {
    private ZonedDateTime datetime;
    private Integer scenarioId;
    private String scenarioType;

    public ZonedDateTimeVo(ZonedDateTime datetime, Integer scenarioId, String scenarioType) {
        this.datetime = datetime;
        this.scenarioId = scenarioId;
        this.scenarioType = scenarioType;
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

    public void setDatetime(ZonedDateTime datetime) {
        this.datetime = datetime;
    }
}
