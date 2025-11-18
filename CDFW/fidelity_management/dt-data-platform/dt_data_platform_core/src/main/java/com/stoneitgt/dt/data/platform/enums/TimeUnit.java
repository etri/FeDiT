package com.stoneitgt.dt.data.platform.enums;

public enum TimeUnit {
    SECOND("초 단위", "S"),
    MINUTE("분 단위", "T"),
    HOUR("시간 단위", "H"),
    DAY("일 단위", "D");

    private final String displayName;
    private final String resampleType;

    TimeUnit(String displayName, String resampleType) {
        this.displayName = displayName;
        this.resampleType = resampleType;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getResampleType() {
        return resampleType;
    }

    public static TimeUnit getUnit(double delta) {
        if (delta < 60) {
            return SECOND;
        } else if (delta < 3600) {
            return MINUTE;
        } else if (delta < 86400) {
            return HOUR;
        } else {
            return DAY;
        }
    }

    public static int getTimeType(String type) {
        int timeType = 0;
        switch (type) {
            case "S":
                timeType = 1;
                break;
            case "T":
                timeType = 60;
                break;
            case "H":
                timeType = 3600;
                break;
            case "D":
                timeType = 3600 * 24;
                break;
            case "M":
                timeType = 3600 * 24 * 30;
                break;
        }
        return timeType;
    }
}
