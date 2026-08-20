package kr.co.e8ight.ndxpro.translatorRunner.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.translatorRunner.exception.SignalSendingFailException;
import okhttp3.*;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;

public class AlertProcessor {

    public static AlertProcessor INSTANCE = new AlertProcessor();
    private static OkHttpClient okHttpClient;
    private static ObjectMapper objectMapper;

    private Headers headers = new Headers.Builder()
            .add("Accept", "application/json")
            .build();
    private String httpUrl;
    private Long translatorId;
    private Long dataSourceId;

    private AlertProcessor() {
        okHttpClient = getSignalClient();
        objectMapper = new ObjectMapper();
    }

    private static final Logger log = LoggerFactory.getLogger(AlertProcessor.class);

    public void sendAlert(Throwable ex) {
        AlertRequestDto requestDto = new AlertRequestDto(
                ex.getMessage(),
                ExceptionUtils.getStackTrace(ex),
                dataSourceId,
                translatorId,
                LocalDateTime.now().toString()
        );
        Request message;
        try {
            message = new Request.Builder()
                    .url(httpUrl)
                    .post(RequestBody.create(MediaType.parse("application/json"),objectMapper.writeValueAsString(requestDto)))
                    .headers(headers)
                    .build();
        } catch (JsonProcessingException e) {
            throw new SignalSendingFailException("alert parsing error : " + e.getMessage());
        }

        Call call = okHttpClient.newCall(message);
        try (Response received = call.execute()) {
            if (!received.isSuccessful()) {
                log.error("alert request fail, code : " + received.code() + ", " + received.message());
                throw new SignalSendingFailException("alert request fail");
            }
            log.debug("Send alert : {}", received.body());
        } catch (IOException e) {
            log.error("Send alert fail : " + e.getMessage());
            throw new SignalSendingFailException(e.getMessage());
        }
    }

    private static OkHttpClient getSignalClient() {
        return new OkHttpClient.Builder()
                .addInterceptor(new CustomInterceptorImpl())
                .connectTimeout(Duration.ofSeconds(10))
                .writeTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofSeconds(10))
                .build();
    }

    public void setup(Long translatorId, Long dataSourceId, String dataIngestUrl) {
        this.translatorId = translatorId;
        this.dataSourceId = dataSourceId;
        httpUrl = dataIngestUrl + "/alerts";
    }
}
