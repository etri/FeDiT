package kr.co.e8ight.ndxpro.databroker.util;

public enum SortTypeCode {
    ASC("ASC", "Ascending"),
    DESC("DESC", "Descending");

    private String type;

    private String description;

    SortTypeCode(String type, String description) {
        this.type = type;
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }
}
