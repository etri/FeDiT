package kr.co.e8ight.ndxpro.translatorRunner.util;

public class AlertRequestDto {
    private String title;
    private String type;
    private String content;
    private Long dataSourceId;
    private Long translatorId;
    private String dateTime;

    public AlertRequestDto(String title, String content, Long dataSourceId, Long translatorId, String dateTime) {
        this.title = title;
        this.type = "TRANSLATOR";
        this.content = content;
        this.dataSourceId = dataSourceId;
        this.translatorId = translatorId;
        this.dateTime = dateTime;
    }

    public AlertRequestDto() {
    }

    public String getTitle() {
        return title;
    }

    public String getType() {
        return type;
    }

    public String getContent() {
        return content;
    }

    public Long getDataSourceId() {
        return dataSourceId;
    }

    public Long getTranslatorId() {
        return translatorId;
    }

    public String getDateTime() {
        return dateTime;
    }
}