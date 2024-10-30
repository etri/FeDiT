package com.stoneitgt.dt.data.platform.util.protocol;


import java.util.HashMap;

/**
 * ProtocolBuilderHelper 클래스는 프로토콜 요청을 생성하는 데 도움을 주는 유틸리티 클래스입니다.
 * HTTP GET 및 POST 요청에 필요한 매개변수를 설정하는 메서드를 제공합니다.
 */
public class ProtocolBuilderHelper {

    /**
     * HTTP GET 요청에 필요한 매개변수를 설정하는 메서드
     *
     * @param params 매개변수를 담고 있는 HashMap 객체
     * @return GET 요청에 필요한 매개변수가 추가된 StringBuilder 객체
     */
    public static StringBuilder setGetMethodParams(HashMap<String, Object> params) {
        int index = 1;
        StringBuilder stringBuilder = new StringBuilder();
        for (HashMap.Entry<String, Object> entry : params.entrySet()) {
            if (index == 1) {
                stringBuilder.append("?" + entry.getKey() + "=" + entry.getValue());
            } else {
                stringBuilder.append("&" + entry.getKey() + "=" + entry.getValue());
            }
            index++;
        }
        return stringBuilder;
    }

    /**
     * HTTP POST 요청에 필요한 매개변수를 설정하는 메서드
     *
     * @param params 매개변수를 담고 있는 HashMap 객체
     * @return POST 요청에 필요한 매개변수가 추가된 StringBuilder 객체
     */
    public static StringBuilder setPostMethodParams(HashMap<String, Object> params) {
        int index = 1;
        StringBuilder stringBuilder = new StringBuilder();
        for (HashMap.Entry<String, Object> entry : params.entrySet()) {
            if (index == 1) {
                stringBuilder.append(entry.getKey() + "=" + entry.getValue());
            } else {
                stringBuilder.append("&" + entry.getKey() + "=" + entry.getValue());
            }
            index++;
        }
        return stringBuilder;
    }
}
