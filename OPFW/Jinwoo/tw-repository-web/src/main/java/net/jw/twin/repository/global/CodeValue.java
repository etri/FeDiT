package net.jw.twin.repository.global;

import lombok.Getter;

public final class CodeValue {
    public enum CD_DTL_CD_ID {
        deleteSt,           // 삭제여부코드

        lang,               // 언어
        program,            // 프로그램 타입
        userSt,             // 사용자상태코드
        useYn,              // 사용여부코드
        restKeyStatus,      // RestKey 상태
    }

    @Getter
    public enum USER_ST {
        ACTIVE(1, "사용중"),
        SUSPENDED(8, "사용중지"),
        WITHDRAWN(9, "탈퇴");

        private final int order;
        private final String desc;

        USER_ST (int order, String desc) {
            this.order = order;
            this.desc = desc;
        }

        public String getName(){
            return name();
        }
    }
    public enum ROLE_AUTH{
        ROLE_SYSTEM,        // 시스템 관리자
        ROLE_MANAGER,       // 최고 관리자
        ROLE_MEMBER_ADMIN,  // 기관 관리자
        ROLE_MEMBER,        // 기관 멤버
        ROLE_USER;          // 일반 사용자
    }

    public enum DataType{
        rawData,
        twinData
    }

    public enum DATA_INFO_NAME {
        air_quality,
        weather,
        life_weather_index,
        health_weather_index,
        road_condition,
        traffic
    }

    public enum DataCategory {
        traffic,
        environment,
        tourism
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
