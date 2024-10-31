package net.jw.twin.repository.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.util.PropertiesUtil;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
public class PrometheusUtil {
    public List<Object> fetchMonitoringData(String job, String startTimestamp, String endTimestamp) {
        String prometheusUrl = PropertiesUtil.getProperty("AppConf.prometheus-api.Url");

        if (prometheusUrl == null || prometheusUrl.isEmpty()) return null;
        if (job == null) job = "";
        try {
            HttpURLConnection conn = null;

            StringBuilder urlBuilder = new StringBuilder(prometheusUrl + "/v1/query_range");
            urlBuilder.append("?" + URLEncoder.encode("query","UTF-8") + "=" + URLEncoder.encode("memory_rss_byte{job='" + job + "'}", "UTF-8"));
            urlBuilder.append("&" + URLEncoder.encode("start","UTF-8") + "=" + URLEncoder.encode(startTimestamp, "UTF-8"));
            urlBuilder.append("&" + URLEncoder.encode("end","UTF-8") + "=" + URLEncoder.encode(endTimestamp, "UTF-8"));
            urlBuilder.append("&" + URLEncoder.encode("step","UTF-8") + "=" + URLEncoder.encode("1m", "UTF-8"));

            conn = getConnection(urlBuilder.toString());
            if (conn == null) return null;

            String line;
            BufferedReader br = null;
            if (conn.getResponseCode() >= 200 && conn.getResponseCode() <= 300) {
                br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));

                StringBuilder sb = new StringBuilder();
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }

                JsonParser jsonParser = new JsonParser();
                JsonObject json = (JsonObject) jsonParser.parse(sb.toString());
                JsonArray values = json.getAsJsonObject("data").getAsJsonArray("result").get(0).getAsJsonObject().getAsJsonArray("values");

                return Arrays.asList(new ObjectMapper().readValue(values.toString(), Object[].class));
            }
            return null;
        } catch(Exception e) {
            log.error("getMonitoringData error!");
            return null;
        }
    }

    private HttpURLConnection getConnection(String link) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(link);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Content-type", "application/json");
            conn.setRequestProperty("X-Scope-OrgId", "digital-twin");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(3000);
            conn.connect();
            return conn;
        } catch (Exception e) {
            return null;
        }
    }
}
