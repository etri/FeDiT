package com.stoneitgt.dt.data.platform.util.protocol;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.Getter;
import org.json.JSONObject;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;

/**
 * ProtocolBuilder 클래스는 REST API 프로토콜을 생성하는 빌더 패턴을 따르며,
 * 주어진 URL에 연결하고 다양한 설정을 통해 통신을 수행합니다.
 * Version information
 * 2022.02.21 2 author : @woosik
 * Class Overview
 * All Rest Api Protocol Creator
 * Case : It follows the factory pattern. new ProtocolBuilder().url().conn().()...
 */
@Getter
public class ProtocolBuilder {
    private URL url;
    private HttpURLConnection conn;
    private StringBuilder stringBuilder;

    /**
     * ProtocolBuilder 클래스의 기본 생성자
     */
    public ProtocolBuilder() {
    }

    /**
     * URL 주소를 설정하는 메서드
     *
     * @param host 호스트 주소
     * @return ProtocolBuilder 객체
     * @throws MalformedURLException 주어진 URL이 올바르지 않은 경우 발생
     */
    public ProtocolBuilder url(String host) throws MalformedURLException {
        url = new URL(host);
        return this;
    }

    /**
     * URL 주소 및 경로를 설정하는 메서드
     *
     * @param host 호스트 주소
     * @param path 경로
     * @return ProtocolBuilder 객체
     * @throws MalformedURLException 주어진 URL이 올바르지 않은 경우 발생
     */
    public ProtocolBuilder url(String host, String path) throws MalformedURLException {
        url = new URL(host + path);
        return this;
    }

    /**
     * HttpURLConnection을 설정하는 메서드
     *
     * @return ProtocolBuilder 객체
     * @throws IOException 연결 설정 중 오류가 발생한 경우 발생
     */
    public ProtocolBuilder conn() throws IOException {
        conn = (HttpURLConnection) this.url.openConnection();
        return this;
    }

    /**
     * HTTP 요청 방식을 설정하는 메서드
     *
     * @param requestMethod HTTP 요청 방식
     * @return ProtocolBuilder 객체
     * @throws ProtocolException 주어진 요청 방식이 잘못된 경우 발생
     */
    public ProtocolBuilder setRequestMethod(String requestMethod) throws ProtocolException {
        conn.setRequestMethod(requestMethod);
        return this;
    }

    /**
     * 출력 스트림 사용 여부를 설정하는 메서드
     *
     * @param output 출력 스트림 사용 여부
     * @return ProtocolBuilder 객체
     */
    public ProtocolBuilder setDoOutput(boolean output) {
        conn.setDoOutput(output);
        return this;
    }

    /**
     * 입력 스트림 사용 여부를 설정하는 메서드
     *
     * @param input 입력 스트림 사용 여부
     * @return ProtocolBuilder 객체
     */
    public ProtocolBuilder setDoInput(boolean input) {
        conn.setDoInput(input);
        return this;
    }

    /**
     * HTTP 요청 헤더 속성을 설정하는 메서드
     *
     * @param requestProperty HTTP 요청 헤더 속성
     * @return ProtocolBuilder 객체
     */
    public ProtocolBuilder setRequestProperty(HashMap<String, String> requestProperty) {
        requestProperty.forEach((key, value) -> {
            conn.setRequestProperty(key, value);
        });
        return this;
    }

    /**
     * JSON 객체를 전송하는 메서드
     *
     * @param jsonObject 전송할 JSON 객체
     * @return ProtocolBuilder 객체
     * @throws IOException 전송 중 오류가 발생한 경우 발생
     */
    public ProtocolBuilder openWriter(JSONObject jsonObject) throws IOException {
        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));
        bw.write(jsonObject.toString());
        bw.flush();
        bw.close();
        return this;
    }

    /**
     * 일반 문자열을 전송하는 메서드
     *
     * @param general_text 전송할 일반 문자열
     * @return ProtocolBuilder 객체
     * @throws IOException 전송 중 오류가 발생한 경우 발생
     */
    public ProtocolBuilder openWriter(String general_text) throws IOException {
        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));
        bw.write(general_text);
        bw.flush();
        bw.close();
        return this;
    }

    /**
     * 매개변수를 이용하여 POST 방식의 데이터를 전송하는 메서드
     *
     * @param params 전송할 매개변수
     * @return ProtocolBuilder 객체
     * @throws IOException 전송 중 오류가 발생한 경우 발생
     */
    public ProtocolBuilder openWriter(HashMap<String, Object> params) throws IOException {
        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));
        stringBuilder = ProtocolBuilderHelper.setPostMethodParams(params);
        bw.write(stringBuilder.toString());
        bw.flush();
        bw.close();
        return this;
    }

    /**
     * 서버로부터 데이터를 읽어오는 메서드
     *
     * @param character_set 문자 인코딩 방식
     * @param class_type    반환할 데이터의 클래스 타입
     * @param logging       로그 출력 여부
     * @param <T>           반환 타입
     * @return 서버로부터 읽어온 데이터
     * @throws IOException 서버와의 통신 중 오류가 발생한 경우 발생
     */
    public <T> T openReader(String character_set, Class<T> class_type, boolean logging) throws IOException {

        int responseCode = conn.getResponseCode();

        BufferedReader br = null;
        if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
            br = new BufferedReader(new InputStreamReader(conn.getInputStream(), character_set));
        } else {
            br = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
        }
        String line = "";
        String result = "";

        while ((line = br.readLine()) != null)
            result += line;

        if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
            if (logging) {
                System.out.println("Success Request -> Result : " + result);
            }
            if (class_type == String.class) {
                return (T) result;
            } else {
                return (T) new Gson().fromJson(result, class_type);
            }
        } else {
            if (logging) {
                System.out.println("Failed Request -> Result : " + result);
            }
            return null;
        }
    }

    /**
     * 서버로부터 배열 형태의 데이터를 읽어오는 메서드
     *
     * @param character_set 문자 인코딩 방식
     * @param class_type    반환할 데이터의 클래스 타입
     * @param logging       로그 출력 여부
     * @param <T>           반환 타입
     * @return 서버로부터 읽어온 배열 형태의 데이터
     * @throws IOException 서버와의 통신 중 오류가 발생한 경우 발생
     */
    public <T> ArrayList<T> openArrayReader(String character_set, Class<T> class_type, boolean logging) throws IOException {

        int responseCode = conn.getResponseCode();

        BufferedReader br = null;
        if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
            br = new BufferedReader(new InputStreamReader(conn.getInputStream(), character_set));
        } else {
            br = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
        }
        String line = "";
        String result = "";

        while ((line = br.readLine()) != null)
            result += line;

        if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
            if (logging) {
                System.out.println("Success Request -> Result : " + result);
            }
            return new Gson().fromJson(result, new TypeToken<ArrayList<T>>() {
            }.getType());

        } else {
            if (logging) {
                System.out.println("Failed Request -> Result : " + result);
            }
            return (ArrayList<T>) Collections.emptyList();
        }
    }

    /**
     * 서버로부터 문자열 형태의 데이터를 읽어오는 메서드
     *
     * @param character_set 문자 인코딩 방식
     * @param logging       로그 출력 여부
     * @return 서버로부터 읽어온 문자열 형태의 데이터
     * @throws IOException 서버와의 통신 중 오류가 발생한 경우 발생
     */
    public String openReader(String character_set, boolean logging) throws IOException {
        int responseCode = conn.getResponseCode();
        BufferedReader br = null;
        if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
            br = new BufferedReader(new InputStreamReader(conn.getInputStream(), character_set));
        } else {
            br = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
        }
        String line = "";
        String result = "";

        while ((line = br.readLine()) != null)
            result += line;

        if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
            if (logging) {
                System.out.println("Success Request -> Result : " + result);
            }
            return result;
        } else {
            if (logging) {
                System.out.println("Failed Request -> Result : " + result);
            }
            return null;
        }
    }
}