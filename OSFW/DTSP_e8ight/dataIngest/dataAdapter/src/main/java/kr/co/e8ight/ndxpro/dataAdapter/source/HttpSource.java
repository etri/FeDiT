package kr.co.e8ight.ndxpro.dataAdapter.source;

import com.fasterxml.jackson.core.JsonProcessingException;
import kr.co.e8ight.ndxpro.dataAdapter.component.SignalProcessor;
import kr.co.e8ight.ndxpro.dataAdapter.exception.ResponseBodyMissingException;
import kr.co.e8ight.ndxpro.dataAdapter.interceptor.CustomInterceptorImpl;
import okhttp3.*;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.flume.Context;
import org.apache.flume.Event;
import org.apache.flume.FlumeException;
import org.apache.flume.event.EventBuilder;
import org.apache.flume.source.AbstractPollableSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.Charset;
import java.util.concurrent.TimeUnit;

public class HttpSource extends AbstractPollableSource {

    private static final int CONN_TIMEOUT = 3;
    private static final Logger log = LoggerFactory.getLogger(HttpSource.class);

    private SourceConfig config;

    @Override
    protected Status doProcess() {
        Headers headers = new Headers.Builder()
                .add("Accept", "application/json")
                .build();

        Request request = null;
        if ( config.getMethod().equalsIgnoreCase("GET") ) {
            request = new Request.Builder()
                    .url(config.getUrlAddr())
                    .get()
                    .headers(headers)
                    .build();
        } else if ( config.getMethod().equalsIgnoreCase("POST") ) {
            String json = config.getJsonBody();
            RequestBody requestBody = RequestBody.create(MediaType.parse("application/json; charset=utf-8"), json);

            request = new Request.Builder()
                    .url(config.getUrlAddr())
                    .post(requestBody)
                    .headers(headers)
                    .build();
        } else {
            throw new RuntimeException("Http Method : " + config.getMethod() + " is invalid.");
        }

        OkHttpClient client = getClient();

        try (Response response = client.newCall(request).execute()) {
            if ( !response.isSuccessful() ) {
                throw new ResponseBodyMissingException("HTTPSource request fail : " + response.message());
            }
            if ( response.body() == null ) {
                throw new ResponseBodyMissingException("HTTPSource response body is null");
            }
            String body = response.body().string();

            sendEvent(body);

            SignalProcessor signalProcessor = SignalProcessor.INSTANCE;
            signalProcessor.sendSignal("source", config.getAgentId());

            Thread.sleep(config.getConnTerm() * 1000);
            return Status.READY;
        } catch (RuntimeException | IOException | InterruptedException e) {
            log.error(ExceptionUtils.getStackTrace(e));
            return Status.BACKOFF;
        }
    }

    @Override
    protected void doConfigure(Context context) throws FlumeException {
        this.config = new SourceConfig(
                context.getString("URL_ADDR"),
                context.getInteger("CONN_TERM") != null ? context.getInteger("CONN_TERM") : 60,
                context.getLong("AGENT_ID"),
                context.getString("METHOD"),
                context.getString("JSON_BODY")
        );
    }

    @Override
    protected void doStart() throws FlumeException {
        log.debug("source {} start", this.getName());
    }

    @Override
    protected void doStop() throws FlumeException {
        log.debug("source {} stop", this.getName());
    }

    private static OkHttpClient getClient() {
        return new OkHttpClient.Builder()
                .addInterceptor(new CustomInterceptorImpl())
                .connectTimeout(CONN_TIMEOUT, TimeUnit.SECONDS)
                .writeTimeout(CONN_TIMEOUT * 10, TimeUnit.SECONDS)
                .readTimeout(CONN_TIMEOUT * 10, TimeUnit.SECONDS)
                .build();
    }

    private void sendEvent(String body) throws JsonProcessingException {
        Event event = EventBuilder.withBody(body.getBytes(Charset.forName("UTF-8")));
        getChannelProcessor().processEvent(event);
    }
}
