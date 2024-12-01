package kr.co.e8ight.ndxpro.translatorRunner.util;

import kr.co.e8ight.ndxpro.translatorRunner.exception.ResponseBodyMissingException;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class SignalProcessor {

    public static SignalProcessor INSTANCE = new SignalProcessor();
    private static OkHttpClient okHttpClient;
    private SignalProcessor() {
        okHttpClient = getSignalClient();
    }

    private static final Logger log = LoggerFactory.getLogger(SignalProcessor.class);

    public void sendSignal(String type, Long translatorId) {
        Headers headers = new Headers.Builder()
                .add("Accept", "application/json")
                .build();
        OkHttpClient client = okHttpClient;
        HttpUrl httpUrl = new HttpUrl.Builder()
                .scheme("http")
                .host("localhost")
                .port(8080)
                .addPathSegments("ndxpro/v1/translator/signal")
                .addQueryParameter("type", type)
                .addQueryParameter("translatorId", String.valueOf(translatorId))
                .build();
        Request signalRequest = new Request.Builder()
                .url(httpUrl)
                .get()
                .headers(headers)
                .build();
        try (Response received = client.newCall(signalRequest).execute()) {
            if (!received.isSuccessful()) {
                log.error("signal request fail, code : " + received.code() + ", " + received.message());
                throw new ResponseBodyMissingException("signal request fail");
            } else if (received.body() == null) {
                log.error("signal response body is null");
                throw new ResponseBodyMissingException("signal response body is null");
            }
            log.debug("signal : {}", received.body().string());
        } catch (IOException e) {
            log.error("SIGNAL_FAIL: " + e.getMessage());
            throw new ResponseBodyMissingException(e.getMessage());
        }
    }

    public void stopSignal(Long agentId, Long translatorId) {
        Headers headers = new Headers.Builder()
                .add("Accept", "application/json")
                .build();
        OkHttpClient client = okHttpClient;
        HttpUrl httpUrl = new HttpUrl.Builder()
                .scheme("http")
                .host("localhost")
                .port(8080)
                .addPathSegments("ndxpro/v1/translator/stopAgent")
                .addQueryParameter("agentId", String.valueOf(agentId))
                .addQueryParameter("translatorId", String.valueOf(translatorId))
                .build();
        Request signalRequest = new Request.Builder()
                .url(httpUrl)
                .get()
                .headers(headers)
                .build();
        try (Response received = client.newCall(signalRequest).execute()) {
            if (!received.isSuccessful()) {
                log.error("signal request fail, code : " + received.code() + ", " + received.message());
                throw new ResponseBodyMissingException("signal request fail");
            } else if (received.body() == null) {
                log.error("signal response body is null");
                throw new ResponseBodyMissingException("signal response body is null");
            }
            log.debug("signal : {}", received.body().string());
        } catch (IOException e) {
            log.error("SIGNAL_FAIL: " + e.getMessage());
            throw new ResponseBodyMissingException(e.getMessage());
        }
    }

    private static OkHttpClient getSignalClient() {
        return new OkHttpClient.Builder()
                .addInterceptor(new CustomInterceptorImpl())
                .connectTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .build();
    }
}
