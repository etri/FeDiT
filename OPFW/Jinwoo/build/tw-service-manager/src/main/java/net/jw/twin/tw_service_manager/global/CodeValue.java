package net.jw.twin.tw_service_manager.global;

import lombok.Getter;

public final class CodeValue {
    public enum DataType{
        rawData,
        twinData
    }

    public enum DataApiType {
        REST
    }

    public enum DataFormat {
        JSON
    }

    @Getter
    public enum DataItemStatus {
        waiting(0, "승인대기"),
        approved(1, "승인"),
        denied(2, "거부"),
        deprecated(3, "사용중지");

        private final int order;
        private final String desc;

        DataItemStatus(int order, String desc) {
            this.order = order;
            this.desc = desc;
        }

        public String getName(){
            return name();
        }
    }

    @Getter
    public enum RestKeyStatus {
        issued(0, "발급"),
        expired(1,"만료");

        private final int order;
        private final String desc;

        RestKeyStatus(int order, String desc) {
            this.order = order;
            this.desc = desc;
        }

        public String getName(){
            return name();
        }
    }

    @Getter
    public enum DataUseStatus {
        waiting(0, "승인대기"),
        approved(1, "승인"),
        denied(2, "거부"),
        deprecated(3, "사용중지");

        private final int order;
        private final String desc;

        DataUseStatus(int order, String desc) {
            this.order = order;
            this.desc = desc;
        }

        public String getName(){
            return name();
        }
    }
}
