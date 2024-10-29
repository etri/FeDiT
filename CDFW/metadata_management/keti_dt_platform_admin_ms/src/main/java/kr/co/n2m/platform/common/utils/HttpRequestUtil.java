package kr.co.n2m.platform.common.utils;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import org.json.simple.JSONObject;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class HttpRequestUtil {
	

    public String sendHttpGetRequest(String url, String method) throws Exception {
        //public key 요청 메소드
        try {
        	URL urlData = new URL(url);
            HttpURLConnection connection = (HttpURLConnection) urlData.openConnection();

            // 요청 방식 설정
            connection.setRequestMethod(method);

            // 응답 코드 확인
            int responseCode = connection.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                throw new RuntimeException("HTTP 요청 에러: " + responseCode);
            }

            // 응답 본문 읽기
            BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String inputLine;
            StringBuffer response = new StringBuffer();
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();

            return response.toString();
			
		} catch (Exception e) {
			// TODO: handle exception
			e.printStackTrace();
			throw e;
		}
    }

	public Map<String, String> sendHttpPostRequest(String url, String method, Map<String, String> bodyMap, String authId) throws IOException {
		// TODO post메소드 + requestBody 요청으로 access token데이터 값 return 받기
		HttpURLConnection con = null;
	    BufferedReader reader = null;
	    Map<String, String> resultMap = new HashMap<>();
	    try {
	        URL obj = new URL(url);
	        con = (HttpURLConnection) obj.openConnection();

	        // 요청 메소드 설정
	        con.setRequestMethod(method);

	        // 요청 헤더 설정
	        con.setRequestProperty("Content-Type", "application/json");
	        con.setRequestProperty("Accept", "application/json");
	        con.setRequestProperty("Authorization", authId);

	        // 요청 바디 생성     
	        JSONObject cred   = new JSONObject();
	        for (Map.Entry<String, String> pair : bodyMap.entrySet()) {
        	  String key = pair.getKey();
        	  String value = pair.getValue();
        	  cred.put(key, value);
        	}
	        byte[] postData = cred.toString().getBytes();
	        
	        // 입력과 출력 활성화
	        con.setDoOutput(true);
	        con.setDoInput(true);

	        // 요청 바디를 연결에 쓰기
	        try (DataOutputStream wr = new DataOutputStream(con.getOutputStream())) {
	            wr.write(postData);
	        }

	        // 응답 코드와 입력 스트림 얻기
	        int responseCode = con.getResponseCode();
	        InputStream is;
	        if (responseCode >= 400) {
	            is = con.getErrorStream();
	        } else {
	            is = con.getInputStream();
	        }

	        // 응답 바디 읽기
	        reader = new BufferedReader(new InputStreamReader(is));
	        StringBuilder sb = new StringBuilder();
	        String line;
	        while ((line = reader.readLine()) != null) {
	            sb.append(line);
	        }
	        String response = sb.toString();

	        log.debug(response);
	        // 응답 바디를 Map으로 파싱
	        Gson gson = new Gson();
	        Type type = new TypeToken<Map<String, String>>(){}.getType();
	        resultMap = gson.fromJson(response, type);
	        resultMap.put("status", String.valueOf(responseCode));
	    } catch (Exception e) {
	        e.printStackTrace();
	        throw e;
	    } finally {
	        // reader와 연결 닫기
	        if (reader != null) {
	            try {
	                reader.close();
	            } catch (IOException e) {
	                e.printStackTrace();
	                throw e;
	            }
	        }
	        if (con != null) {
	            con.disconnect();
	        }
	    }
	    return resultMap;
    }
}


